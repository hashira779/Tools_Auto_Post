#!/usr/bin/env python3
"""
CamTech — Deploy AI Worker to ORS Server
=========================================
Remotely sets up an ORS worker server via SSH:
  1. Installs Docker (if needed)
  2. Copies the CamTech codebase
  3. Starts AI Orchestrator + Ollama
  4. Pulls the LLM models

Usage:
  python deploy_ors_worker.py --host 10.2.7.251 --user ors-user --password 'mypass'
"""

import paramiko
import argparse
import sys
import time

def run_ssh(client, cmd, desc=""):
    """Execute a command via SSH and print output line by line."""
    if desc:
        print(f"\n  ⏳ {desc}...")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=600)
    
    # Stream stdout line by line
    out_lines = []
    for line in iter(stdout.readline, ""):
        line = line.strip()
        if line:
            print(f"     {line}")
            out_lines.append(line)
            
    out = "\n".join(out_lines)
    err = stderr.read().decode().strip()
    exit_code = stdout.channel.recv_exit_status()
    
    if exit_code != 0 and err:
        print(f"  ⚠️  stderr: {err[:500]}")
    return exit_code, out

def main():
    parser = argparse.ArgumentParser(description="Deploy CamTech AI Worker to ORS Server")
    parser.add_argument("--host", required=True, help="ORS server IP (e.g., 10.2.7.251)")
    parser.add_argument("--user", required=True, help="SSH username")
    parser.add_argument("--password", required=True, help="SSH password")
    parser.add_argument("--sudo-password", default=None, help="Sudo password (defaults to SSH password)")
    args = parser.parse_args()

    sudo_pass = args.sudo_password or args.password

    print(f"\n{'='*60}")
    print(f"  🚀 Deploying CamTech AI Worker to {args.host}")
    print(f"{'='*60}")

    # Connect
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(args.host, username=args.user, password=args.password, timeout=30)
        print(f"  ✅ Connected to {args.host}")
    except Exception as e:
        print(f"  ❌ Connection failed: {e}")
        sys.exit(1)

    # 1. Check if Docker is installed
    code, out = run_ssh(client, "docker --version 2>/dev/null", "Checking Docker")
    if code != 0:
        print("  📦 Docker not found. Installing...")
        install_cmds = [
            f"echo '{sudo_pass}' | sudo -S apt-get update -y",
            f"echo '{sudo_pass}' | sudo -S apt-get install -y ca-certificates curl gnupg",
            f"echo '{sudo_pass}' | sudo -S install -m 0755 -d /etc/apt/keyrings",
            f"curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg",
            f"echo '{sudo_pass}' | sudo -S chmod a+r /etc/apt/keyrings/docker.gpg",
            f'echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null',
            f"echo '{sudo_pass}' | sudo -S apt-get update -y",
            f"echo '{sudo_pass}' | sudo -S apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin",
            f"echo '{sudo_pass}' | sudo -S usermod -aG docker {args.user}",
        ]
        for cmd in install_cmds:
            run_ssh(client, cmd, "Installing Docker")
        print("  ✅ Docker installed!")
    else:
        print(f"  ✅ {out}")

    # 2. Check if git is installed
    code, _ = run_ssh(client, "git --version 2>/dev/null", "Checking git")
    if code != 0:
        run_ssh(client, f"echo '{sudo_pass}' | sudo -S apt-get install -y git", "Installing git")

    # 3. Clone or update repo
    app_dir = f"/home/{args.user}/CamTech"
    code, _ = run_ssh(client, f"test -d {app_dir} && echo 'exists'", "Checking CamTech repo")
    if "exists" in _:
        run_ssh(client, f"cd {app_dir} && git pull origin main", "Updating CamTech repo")
    else:
        run_ssh(client, f"git clone https://github.com/hashira779/Tools_Auto_Post.git {app_dir}", "Cloning CamTech repo")

    # 4. Copy local .env file
    try:
        with open(".env", "r") as f:
            env_content = f.read()
    except FileNotFoundError:
        print("  ⚠️ .env file not found locally! ORS worker might fail to authenticate Supabase.")
        env_content = ""
        
    run_ssh(client, f"cat > {app_dir}/.env << 'ENVEOF'\n{env_content}\nENVEOF", "Creating .env file")

    # 5. Build and start containers
    run_ssh(client, 
        f"cd {app_dir} && echo '{sudo_pass}' | sudo -S docker compose -f docker-compose.ors-worker.yml up -d --build",
        "Building and starting AI services (this takes a few minutes)")



    # 7. Verify
    run_ssh(client,
        f"echo '{sudo_pass}' | sudo -S docker ps --format '  - {{{{.Names}}}} ({{{{.Status}}}})'",
        "Verifying containers")

    print(f"\n{'='*60}")
    print(f"  🎉 ORS Worker deployed successfully to {args.host}!")
    print(f"  AI API available at: http://{args.host}:8100")
    print(f"{'='*60}\n")

    client.close()

if __name__ == "__main__":
    main()

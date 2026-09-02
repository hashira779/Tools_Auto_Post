#!/usr/bin/env python3
"""
CamTech — Deploy AI Worker to ORS Server
=========================================
Remotely sets up an ORS worker server via SSH:
  1. Installs Docker (if needed)
  2. Copies the CamTech codebase
  3. Starts AI Orchestrator + Ollama
  4. Pulls the LLM models

Exits non-zero if any required step fails, so CI reports a broken worker
instead of printing a success banner over the top of it.

Usage:
  python deploy_ors_worker.py --host 10.2.7.252 --user ors-user --password 'mypass'
"""

import paramiko
import argparse
import sys
import time

# Docker image builds need real headroom. Below this the build, the git pull
# and the .env write all fail — usually in ways that point somewhere else.
MIN_FREE_MB = 2048

# Steps that failed but did not stop the run outright.
FAILURES = []


def run_ssh(client, cmd, desc="", check=False):
    """Execute a command via SSH and print output line by line.

    Set check=True for steps the deploy cannot succeed without; those get
    recorded in FAILURES and turn into a non-zero exit at the end.
    """
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
    if exit_code != 0 and check:
        print(f"  ❌ FAILED ({exit_code}): {desc or cmd}")
        FAILURES.append(desc or cmd)
    return exit_code, out


def finish(host, ok_message):
    """Print the outcome and exit with a status that reflects reality."""
    print(f"\n{'='*60}")
    if FAILURES:
        print(f"  ❌ ORS Worker deploy FAILED on {host}")
        for f in FAILURES:
            print(f"     - {f}")
        print(f"{'='*60}\n")
        sys.exit(1)
    print(ok_message)
    print(f"{'='*60}\n")


def main():
    parser = argparse.ArgumentParser(description="Deploy CamTech AI Worker to ORS Server")
    parser.add_argument("--host", required=True, help="ORS server IP (e.g., 10.2.7.252)")
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

    # 0. Disk space — check before anything writes.
    # A full disk previously showed up as "POSTGRES_PASSWORD must be set",
    # because git pull and the .env write both failed silently first.
    code, out = run_ssh(client, "df -Pk / | awk 'NR==2 {print $4}'", "Checking free disk space")
    free_mb = int(out.strip()) // 1024 if code == 0 and out.strip().isdigit() else None
    if free_mb is None:
        print("  ⚠️  Could not determine free disk space; continuing.")
    else:
        print(f"     {free_mb} MB free on /")
        if free_mb < MIN_FREE_MB:
            print(f"  ❌ Only {free_mb} MB free, need at least {MIN_FREE_MB} MB.")
            print(f"     Free it up with:")
            print(f"       ssh {args.user}@{args.host} 'cd ~/CamTech && bash scripts/cleanup_disk.sh'")
            FAILURES.append(f"insufficient disk space ({free_mb} MB free)")
            client.close()
            # Everything below writes to disk, so stop rather than emit a
            # cascade of misleading errors.
            finish(args.host, "")

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
            run_ssh(client, cmd, "Installing Docker", check=True)
        print("  ✅ Docker installed!")
    else:
        print(f"  ✅ {out}")

    # 2. Check if git is installed
    code, _ = run_ssh(client, "git --version 2>/dev/null", "Checking git")
    if code != 0:
        run_ssh(client, f"echo '{sudo_pass}' | sudo -S apt-get install -y git", "Installing git", check=True)

    # 3. Clone or update repo
    app_dir = f"/home/{args.user}/CamTech"
    code, repo_check = run_ssh(client, f"test -d {app_dir} && echo 'exists'", "Checking CamTech repo")
    if "exists" in repo_check:
        run_ssh(client, f"cd {app_dir} && git pull origin main", "Updating CamTech repo", check=True)
    else:
        run_ssh(client, f"git clone https://github.com/hashira779/Tools_Auto_Post.git {app_dir}",
                "Cloning CamTech repo", check=True)

    # 4. Copy local .env file
    try:
        with open(".env", "r") as f:
            env_content = f.read()
    except FileNotFoundError:
        print("  ⚠️ .env file not found locally! ORS worker might fail to authenticate Supabase.")
        env_content = ""

    run_ssh(client, f"cat > {app_dir}/.env << 'ENVEOF'\n{env_content}\nENVEOF",
            "Creating .env file", check=True)

    # Confirm the file actually landed. A truncated write here is what turned
    # a full disk into a confusing "POSTGRES_PASSWORD must be set" further down.
    if "POSTGRES_PASSWORD=" in env_content:
        _, verify = run_ssh(client, f"grep -q '^POSTGRES_PASSWORD=' {app_dir}/.env && echo ok",
                            "Verifying .env was written")
        if "ok" not in verify:
            print("  ❌ .env is missing POSTGRES_PASSWORD — the write did not complete.")
            FAILURES.append(".env write incomplete")

    # 5. Build and start containers
    run_ssh(client,
        f"cd {app_dir} && echo '{sudo_pass}' | sudo -S docker compose -f docker-compose.ors-worker.yml up -d --build",
        "Building and starting AI services (this takes a few minutes)", check=True)

    # 6. Verify (informational)
    run_ssh(client,
        f"echo '{sudo_pass}' | sudo -S docker ps --format '  - {{{{.Names}}}} ({{{{.Status}}}})'",
        "Verifying containers")

    client.close()

    finish(args.host,
           f"  🎉 ORS Worker deployed successfully to {args.host}!\n"
           f"  AI API available at: http://{args.host}:8100")


if __name__ == "__main__":
    main()

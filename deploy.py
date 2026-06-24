import paramiko
import os

host = "10.1.0.11"
user = "ubuntu-server"
password = "pTT!CT01"
remote_dir = "/home/ubuntu-server/AUTO_POST"

def run_command(ssh, cmd):
    print(f"Running: {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    while True:
        line = stdout.readline()
        if not line:
            break
        print(line, end="")
    err = stderr.read().decode()
    if err:
        print(f"Stderr: {err}")

def deploy():
    print("Connecting to Ubuntu server via SSH...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, username=user, password=password, timeout=10)
    
    # Create remote directory
    run_command(ssh, f"mkdir -p {remote_dir}")
    run_command(ssh, f"mkdir -p {remote_dir}/downloads")
    
    print("Uploading files...")
    sftp = ssh.open_sftp()
    local_dir = r"D:\AUTO_POST"
    
    # Folders to ignore
    ignore = ['.venv', '.git', '__pycache__', 'downloads']
    
    for root, dirs, files in os.walk(local_dir):
        # Filter ignores
        dirs[:] = [d for d in dirs if d not in ignore]
        
        rel_path = os.path.relpath(root, local_dir)
        if rel_path == ".":
            remote_path = remote_dir
        else:
            remote_path = f"{remote_dir}/{rel_path.replace(os.sep, '/')}"
            try:
                sftp.stat(remote_path)
            except IOError:
                sftp.mkdir(remote_path)
                
        for f in files:
            local_file = os.path.join(root, f)
            remote_file = f"{remote_path}/{f}"
            print(f"Uploading {f}...")
            sftp.put(local_file, remote_file)
            
    sftp.close()
    
    print("\nFiles uploaded! Installing dependencies directly on Ubuntu...")
    setup_cmds = [
        f"echo '{password}' | sudo -S apt-get update",
        f"echo '{password}' | sudo -S apt-get install -y ffmpeg python3-venv python3-pip",
        f"cd {remote_dir} && python3 -m venv .venv",
        f"cd {remote_dir} && .venv/bin/pip install -r requirements.txt",
    ]
    
    for cmd in setup_cmds:
        run_command(ssh, cmd)
        
    print("\nSetting up auto-restart background service...")
    service_content = f"""[Unit]
Description=Auto Post Telegram Bot
After=network.target

[Service]
User={user}
WorkingDirectory={remote_dir}
ExecStart={remote_dir}/.venv/bin/python main.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
"""
    
    run_command(ssh, f"cat << 'EOF' > /tmp/autopost.service\n{service_content}\nEOF")
    run_command(ssh, f"echo '{password}' | sudo -S mv /tmp/autopost.service /etc/systemd/system/autopost.service")
    run_command(ssh, f"echo '{password}' | sudo -S systemctl daemon-reload")
    run_command(ssh, f"echo '{password}' | sudo -S systemctl enable autopost")
    run_command(ssh, f"echo '{password}' | sudo -S systemctl restart autopost")
    
    print("\n✅ Deployed successfully! The bot is now running natively on Ubuntu 24/7.")
    ssh.close()

if __name__ == "__main__":
    deploy()

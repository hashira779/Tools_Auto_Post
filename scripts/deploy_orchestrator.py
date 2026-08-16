import paramiko
import sys
import os

hostname = "10.1.0.11"
username = "ubuntu-server"
password = "pTT!CT01"

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Map of local file -> remote file
files_to_sync = {
    "docker-compose.yml": "CamTech/docker-compose.yml",
    "services/ai-orchestrator-api/Dockerfile": "CamTech/services/ai-orchestrator-api/Dockerfile",
    "services/ai-orchestrator-api/requirements.txt": "CamTech/services/ai-orchestrator-api/requirements.txt",
    "services/ai-orchestrator-api/app/main.py": "CamTech/services/ai-orchestrator-api/app/main.py",
    "services/ai-orchestrator-api/app/database.py": "CamTech/services/ai-orchestrator-api/app/database.py",
    "services/ai-orchestrator-api/app/models.py": "CamTech/services/ai-orchestrator-api/app/models.py",
    "services/ai-orchestrator-api/app/agent.py": "CamTech/services/ai-orchestrator-api/app/agent.py",
    "services/ai-orchestrator-api/app/tools.py": "CamTech/services/ai-orchestrator-api/app/tools.py",
}

try:
    print(f"Connecting to {hostname}...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(hostname, username=username, password=password, timeout=10)
    print("Connected successfully!")
    
    sftp = client.open_sftp()
    
    for local_rel, remote_rel in files_to_sync.items():
        local_path = os.path.join(base_dir, local_rel.replace('/', '\\'))
        remote_path = f"/home/ubuntu-server/{remote_rel}"
        
        # Ensure remote directory exists
        remote_dir = os.path.dirname(remote_path).replace("\\", "/")
        client.exec_command(f"mkdir -p {remote_dir}")
        
        print(f"Uploading {local_path} to {remote_path}...")
        sftp.put(local_path, remote_path)
        
    sftp.close()
    print("Upload complete! Starting Postgres and Orchestrator...")

    commands = [
        f"cd /home/ubuntu-server/CamTech && echo '{password}' | sudo -S docker compose up -d --build postgres ai-orchestrator-api",
        "echo 'Services rebuilt and started!'"
    ]
    
    for cmd in commands:
        print(f"Running: {cmd}")
        stdin, stdout, stderr = client.exec_command(cmd)
        
        # Stream output
        for line in iter(stdout.readline, ""):
            print(line, end="")
            
        err = stderr.read().decode().strip()
        if err:
            print(f"Stderr: {err}")
            
    client.close()
    print("Done!")
except Exception as e:
    print(f"Error: {e}")

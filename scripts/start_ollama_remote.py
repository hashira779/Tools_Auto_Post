import paramiko
import sys
import os

hostname = "10.1.0.11"
username = "ubuntu-server"
password = "pTT!CT01"

try:
    print(f"Connecting to {hostname}...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(hostname, username=username, password=password, timeout=10)
    print("Connected successfully!")
    
    # SFTP to upload docker-compose.yml
    sftp = client.open_sftp()
    local_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "docker-compose.yml")
    remote_path = "/home/ubuntu-server/CamTech/docker-compose.yml"
    
    print(f"Uploading {local_path} to {remote_path}...")
    sftp.put(local_path, remote_path)
    sftp.close()
    print("Upload complete!")

    # Start Ollama
    commands = [
        f"cd /home/ubuntu-server/CamTech && echo '{password}' | sudo -S docker compose up -d ollama",
        "echo 'Ollama container started!'"
    ]
    
    for cmd in commands:
        print(f"Running: {cmd}")
        stdin, stdout, stderr = client.exec_command(cmd)
        print(stdout.read().decode().strip())
        err = stderr.read().decode().strip()
        if err:
            print(f"Stderr: {err}")
            
    client.close()
    print("Done!")
except Exception as e:
    print(f"Error: {e}")

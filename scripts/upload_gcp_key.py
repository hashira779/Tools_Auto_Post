import paramiko
import sys
import os
import json

hostname = "10.1.0.11"
username = "ubuntu-server"
password = "pTT!CT01"
local_file = "d:/Project/CamTech/json-468007-770c47dec4a9.json"
remote_dir = "/home/ubuntu-server/CamTech/credentials"
remote_file = f"{remote_dir}/google_credentials.json"

try:
    if not os.path.exists(local_file):
        print(f"Local file {local_file} not found!")
        sys.exit(1)
        
    print(f"Connecting to {hostname}...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(hostname, username=username, password=password, timeout=10)
    
    # Ensure remote directory exists
    stdin, stdout, stderr = client.exec_command(f"mkdir -p {remote_dir}")
    stdout.read()
    
    # Upload file securely via SFTP
    print(f"Uploading GCP key to {remote_file}...")
    sftp = client.open_sftp()
    sftp.put(local_file, remote_file)
    sftp.close()
    
    # Restart the container so it picks up the key
    print("Restarting sticker-api container...")
    cmd = f"cd /home/ubuntu-server/CamTech && echo '{password}' | sudo -S docker compose restart sticker-api"
    stdin, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    
    print("STDOUT:", out)
    if err and "[sudo]" not in err:
        print("STDERR:", err)
        
    client.close()
    print("Successfully uploaded Google Cloud credentials!")
except Exception as e:
    print(f"Failed: {e}")
    sys.exit(1)

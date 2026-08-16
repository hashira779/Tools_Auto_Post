import paramiko
import sys
import os

hostname = "10.1.0.11"
username = "ubuntu-server"
password = "pTT!CT01"

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Map of local file -> remote file
files_to_sync = {
    "services/savemedia-web/frontend/nginx.conf": "CamTech/services/savemedia-web/frontend/nginx.conf",
    "services/savemedia-web/frontend/src/components/AppNavbar.jsx": "CamTech/services/savemedia-web/frontend/src/components/AppNavbar.jsx",
    "services/savemedia-web/frontend/src/App.jsx": "CamTech/services/savemedia-web/frontend/src/App.jsx",
    "services/savemedia-web/frontend/src/hooks/useOllama.js": "CamTech/services/savemedia-web/frontend/src/hooks/useOllama.js",
    "services/savemedia-web/frontend/src/hooks/useAuth.js": "CamTech/services/savemedia-web/frontend/src/hooks/useAuth.js",
    "services/savemedia-web/frontend/src/lib/supabase.js": "CamTech/services/savemedia-web/frontend/src/lib/supabase.js",
    "services/savemedia-web/frontend/src/components/chat/ChatMessage.jsx": "CamTech/services/savemedia-web/frontend/src/components/chat/ChatMessage.jsx",
    "services/savemedia-web/frontend/src/components/chat/AIChatStudio.jsx": "CamTech/services/savemedia-web/frontend/src/components/chat/AIChatStudio.jsx",
    "services/savemedia-web/frontend/package.json": "CamTech/services/savemedia-web/frontend/package.json",
    "services/savemedia-web/frontend/package-lock.json": "CamTech/services/savemedia-web/frontend/package-lock.json",
    ".env": "CamTech/services/savemedia-web/frontend/.env",
}

try:
    print(f"Connecting to {hostname}...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(hostname, username=username, password=password, timeout=30)
    print("Connected successfully!")
    
    sftp = client.open_sftp()
    
    for local_rel, remote_rel in files_to_sync.items():
        local_path = os.path.join(base_dir, local_rel.replace('/', '\\'))
        remote_path = f"/home/ubuntu-server/{remote_rel}"
        
        # Ensure remote directory exists
        remote_dir = os.path.dirname(remote_path)
        client.exec_command(f"mkdir -p {remote_dir}")
        
        print(f"Uploading {local_path} to {remote_path}...")
        sftp.put(local_path, remote_path)
        
    sftp.close()
    print("Upload complete! Rebuilding frontend...")

    # Start Ollama
    commands = [
        f"cd /home/ubuntu-server/CamTech && echo '{password}' | sudo -S docker compose up -d --build savemedia-frontend",
        "echo 'Frontend container rebuilt and started!'"
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

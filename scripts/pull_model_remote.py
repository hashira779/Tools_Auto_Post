import paramiko
import sys

hostname = "10.1.0.11"
username = "ubuntu-server"
password = "pTT!CT01"

try:
    print(f"Connecting to {hostname}...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(hostname, username=username, password=password, timeout=10)
    print("Connected successfully!")
    
    # We will pull the model instead of 'run' so it doesn't open an interactive chat
    model = "llama3.2"
    cmd = f"echo '{password}' | sudo -S docker exec camtech-ollama ollama pull {model}"
    
    print(f"Downloading model '{model}' on the server (this may take a few minutes)...")
    stdin, stdout, stderr = client.exec_command(cmd)
    
    # Print output line by line as it downloads
    for line in iter(stdout.readline, ""):
        print(line, end="")
        
    err = stderr.read().decode().strip()
    if err:
        print(f"Stderr: {err}")
            
    client.close()
    print("Model downloaded and ready!")
except Exception as e:
    print(f"Error: {e}")

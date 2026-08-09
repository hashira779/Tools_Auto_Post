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
    
    # Restart the runner to force it to drop the ghost job
    commands = [
        "cd /home/ubuntu-server/actions-runner && echo pTT!CT01 | sudo -S ./svc.sh stop",
        "cd /home/ubuntu-server/actions-runner && echo pTT!CT01 | sudo -S ./svc.sh start",
        "echo 'Runner restarted!'"
    ]
    
    for cmd in commands:
        print(f"Running: {cmd}")
        stdin, stdout, stderr = client.exec_command(cmd)
        print(stdout.read().decode().strip())
            
    client.close()
    print("Done!")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)

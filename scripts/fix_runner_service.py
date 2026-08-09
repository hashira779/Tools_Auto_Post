import paramiko
import sys

hostname = "10.1.0.11"
username = "ubuntu-server"
password = "pTT!CT01"

try:
    print(f"Connecting to {hostname} to fix runner service...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(hostname, username=username, password=password, timeout=10)
    
    commands = [
        "cd /home/ubuntu-server/actions-runner && echo pTT!CT01 | sudo -S ./svc.sh install",
        "cd /home/ubuntu-server/actions-runner && echo pTT!CT01 | sudo -S ./svc.sh start",
        "cd /home/ubuntu-server/actions-runner && echo pTT!CT01 | sudo -S ./svc.sh status"
    ]
    
    for cmd in commands:
        print(f"--- Running: {cmd} ---")
        stdin, stdout, stderr = client.exec_command(cmd)
        print("OUTPUT:", stdout.read().decode().strip())
        err = stderr.read().decode().strip()
        if err:
            print("ERROR:", err)
            
    client.close()
    print("Finished configuring runner service!")
except Exception as e:
    print(f"Connection failed: {e}")
    sys.exit(1)

import paramiko
import sys

hostname = "10.1.0.11"
username = "ubuntu-server"
password = "pTT!CT01"

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(hostname, username=username, password=password, timeout=10)
    
    # Check what is currently running on the server
    commands = [
        "ps fux | grep -E 'docker|apt|dpkg'",
        "dmesg | tail -n 20",
        "free -m"
    ]
    
    for cmd in commands:
        print(f"--- {cmd} ---")
        stdin, stdout, stderr = client.exec_command(cmd)
        print(stdout.read().decode().strip())
            
    client.close()
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)

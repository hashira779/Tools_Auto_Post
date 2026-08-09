import paramiko
import sys
import time

hostname = "10.1.0.11"
username = "ubuntu-server"
password = "pTT!CT01"

try:
    print(f"Connecting to {hostname}...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(hostname, username=username, password=password, timeout=10)
    print("Connected successfully!")
    
    commands = [
        "echo pTT!CT01 | sudo -S growpart /dev/sda 2",
        "echo pTT!CT01 | sudo -S growpart /dev/sda 5",
        "echo pTT!CT01 | sudo -S resize2fs /dev/sda5",
        "df -h /"
    ]
    
    for cmd in commands:
        print(f"Running: {cmd}")
        stdin, stdout, stderr = client.exec_command(cmd)
        
        out = stdout.read().decode().strip()
        err = stderr.read().decode().strip()
        
        if out:
            print(f"STDOUT: {out}")
        if err and "password for" not in err:
            print(f"STDERR: {err}")
            
    client.close()
    print("Done!")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)

import paramiko
import sys

hostname = "10.1.0.11"
username = "ubuntu-server"
password = "pTT!CT01"

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(hostname, username=username, password=password, timeout=10)
    
    cmd = "docker logs camtech-sticker-api --tail 50"
    print(f"--- {cmd} ---")
    stdin, stdout, stderr = client.exec_command(cmd)
    
    print("STDOUT:")
    print(stdout.read().decode().strip())
    
    print("\nSTDERR:")
    print(stderr.read().decode().strip())
            
    client.close()
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)

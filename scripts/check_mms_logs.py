import paramiko
import sys

hostname = "10.1.0.11"
username = "ubuntu-server"
password = "pTT!CT01"

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(hostname, username=username, password=password, timeout=10)
    
    cmd = "echo pTT!CT01 | sudo -S docker logs --tail 50 camtech-mms-tts"
    stdin, stdout, stderr = client.exec_command(cmd)
    output = stdout.read().decode().strip()
    error = stderr.read().decode().strip()
    
    print("STDOUT:\n", output)
    
    if error.startswith("[sudo] password for ubuntu-server:"):
        error = error.replace("[sudo] password for ubuntu-server:", "").strip()
        
    if error:
        print("STDERR:\n", error)
        
    client.close()
except Exception as e:
    print(f"Connection failed: {e}")
    sys.exit(1)

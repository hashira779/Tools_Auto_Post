import paramiko
import sys

hostname = "10.1.0.11"
username = "ubuntu-server"
password = "pTT!CT01"

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(hostname, username=username, password=password, timeout=10)
    
    commands = [
        "df -h",
        "lsblk",
        "echo pTT!CT01 | sudo -S vgs",
        "echo pTT!CT01 | sudo -S lvs",
        "echo pTT!CT01 | sudo -S vgdisplay"
    ]
    
    for cmd in commands:
        print(f"--- {cmd} ---")
        stdin, stdout, stderr = client.exec_command(cmd)
        print(stdout.read().decode().strip())
        err = stderr.read().decode().strip()
        if err and "password for" not in err:
            print(f"ERR: {err}")
            
    client.close()
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)

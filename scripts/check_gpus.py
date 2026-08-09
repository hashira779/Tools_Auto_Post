import paramiko
import socket

servers = [
    {"ip": "10.2.7.251", "username": "ors-server1"},
    {"ip": "10.2.7.252", "username": "ors-server2"}
]
password = "pTT!CT01"

print("Starting GPU check...")

for srv in servers:
    ip = srv["ip"]
    username = srv["username"]
    print(f"\n--- Checking IP: {ip} (User: {username}) ---")
    try:
        # Check if port 22 is open first
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2)
        result = sock.connect_ex((ip, 22))
        sock.close()
        
        if result != 0:
            print(f"Port 22 is closed or host is unreachable.")
            continue
            
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(ip, username=username, password=password, timeout=5)
        
        print("Connected successfully! Checking for GPU...")
        # Check for nvidia-smi
        stdin, stdout, stderr = client.exec_command("nvidia-smi")
        output = stdout.read().decode('utf-8').strip()
        
        if output and "command not found" not in output.lower():
            print("✅ GPU FOUND via nvidia-smi:")
            print('\n'.join(output.split('\n')[:10]))
        else:
            # Fallback to lspci to see if there is any VGA/3D controller that might be a GPU
            stdin, stdout, stderr = client.exec_command("lspci | grep -i 'vga\\|3d\\|nvidia\\|amd'")
            lspci_out = stdout.read().decode('utf-8').strip()
            if lspci_out:
                print("⚠️ No nvidia-smi, but found these graphics devices:")
                print(lspci_out)
            else:
                print("❌ No GPU detected on this system.")
                
        client.close()
    except paramiko.AuthenticationException:
        print("Authentication failed. Wrong username/password.")
    except Exception as e:
        print(f"Connection failed: {e}")

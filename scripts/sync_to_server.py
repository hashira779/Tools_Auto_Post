import paramiko
import os
import tarfile
import time

hostname = "10.1.0.11"
username = "ubuntu-server"
password = "pTT!CT01"

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
tar_filename = "update.tar.gz"
tar_path = os.path.join(base_dir, tar_filename)

def filter_tar(tarinfo):
    # Exclude unnecessary and large folders
    excludes = ['node_modules', '.git', '__pycache__', 'dist', '.venv', 'downloads', '.env.local', 'update.tar.gz']
    for ex in excludes:
        # Check if the exact folder/file name is in the path
        parts = tarinfo.name.split('/')
        if ex in parts:
            return None
    return tarinfo

print("1. Creating tarball of the project (this might take a few seconds)...")
with tarfile.open(tar_path, "w:gz") as tar:
    tar.add(base_dir, arcname='.', filter=filter_tar)
print(f"Tarball created: {os.path.getsize(tar_path) / (1024*1024):.2f} MB")

try:
    print(f"2. Connecting to {hostname}...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(hostname, username=username, password=password, timeout=30)
    print("Connected successfully!")
    
    sftp = client.open_sftp()
    remote_tar_path = f"/home/ubuntu-server/{tar_filename}"
    
    print("3. Uploading tarball to server...")
    sftp.put(tar_path, remote_tar_path)
    sftp.close()
    
    print("4. Extracting on the server...")
    commands = [
        f"mkdir -p /home/ubuntu-server/CamTech",
        f"tar -xzf {remote_tar_path} -C /home/ubuntu-server/CamTech",
        f"rm {remote_tar_path}"
    ]
    
    for cmd in commands:
        print(f"Running: {cmd}")
        stdin, stdout, stderr = client.exec_command(cmd)
        err = stderr.read().decode().strip()
        if err:
            print(f"Stderr: {err}")
            
    client.close()
    print("=========================================")
    print("✅ Sync Complete! Your Ubuntu server now perfectly matches your PC.")
    print("=========================================")

except Exception as e:
    print(f"Error: {e}")
finally:
    if os.path.exists(tar_path):
        os.remove(tar_path)

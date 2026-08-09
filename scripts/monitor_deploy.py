import paramiko
import time

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.1.0.11', username='ubuntu-server', password='pTT!CT01', timeout=10)

print("Monitoring production deployment status on server...")
for i in range(30):
    stdin, stdout, stderr = client.exec_command('curl -s -o /dev/null -w "%{http_code}" http://localhost:80/api/sticker/styles')
    code = stdout.read().decode().strip()
    print(f"[{i+1}/30] Health Check Response: {code}")
    if code == "200":
        print("✅ SUCCESS! Sticker API is responding with 200 OK.")
        break
    time.sleep(3)

client.close()

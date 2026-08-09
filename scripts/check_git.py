import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.1.0.11', username='ubuntu-server', password='pTT!CT01', timeout=10)
stdin, stdout, stderr = client.exec_command('cd /home/ubuntu-server/CamTech && git log -1')
print(stdout.read().decode())
client.close()

import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.1.0.11', username='ubuntu-server', password='pTT!CT01', timeout=10)

stdin, stdout, stderr = client.exec_command('ls -t /home/ubuntu-server/actions-runner/_diag/Worker_*.log | head -n 1 | xargs tail -n 120')
print("=== WORKER LOG TAIL ===")
print(stdout.read().decode())
print(stderr.read().decode())
client.close()

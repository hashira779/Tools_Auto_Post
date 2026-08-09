import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.1.0.11', username='ubuntu-server', password='pTT!CT01', timeout=10)

stdin, stdout, stderr = client.exec_command('grep -rn "DEPLOYMENT FAILED" /home/ubuntu-server/actions-runner/_diag/blocks/')
print("=== GREP RESULTS ===")
print(stdout.read().decode())
print(stderr.read().decode())
client.close()

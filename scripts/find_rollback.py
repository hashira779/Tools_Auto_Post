import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.1.0.11', username='ubuntu-server', password='pTT!CT01', timeout=10)

cmd = '''
grep -rn "Rollback complete" /home/ubuntu-server/actions-runner/ 2>/dev/null | head -n 10
'''
stdin, stdout, stderr = client.exec_command(cmd)
print("=== GREP ROLLBACK ===")
print(stdout.read().decode())
print(stderr.read().decode())
client.close()

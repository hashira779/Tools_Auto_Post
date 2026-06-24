import paramiko
ssh=paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('10.1.0.11', username='ubuntu-server', password='pTT!CT01')
stdin, stdout, stderr = ssh.exec_command('cd /home/ubuntu-server/AUTO_POST && sudo -S docker compose logs --tail=50 auto-post-bot')
stdin.write('pTT!CT01\n')
stdin.flush()
print(stdout.read().decode())
print(stderr.read().decode())

import paramiko
ssh=paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('10.1.0.11', username='ubuntu-server', password='pTT!CT01')
stdin, stdout, stderr = ssh.exec_command('docker exec auto-post-bot yt-dlp -F "https://youtu.be/rfB53yFmrmk?si=Lag4B8nImFtJaqPE"')
print(stdout.read().decode())
print(stderr.read().decode())

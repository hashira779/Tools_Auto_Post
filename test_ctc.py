import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('10.1.0.11', username='ubuntu-server', password='pTT!CT01')

cmd = 'sudo -S docker exec auto-post-bot python -c "from ctc_forced_aligner import preprocess_text; t, text = preprocess_text(\'hello world\', romanize=True, language=\'eng\'); print(type(text)); print(repr(text))"'

stdin, stdout, stderr = ssh.exec_command(cmd)
stdin.write('pTT!CT01\n')
stdin.flush()

print('STDOUT:', stdout.read().decode())
print('STDERR:', stderr.read().decode())

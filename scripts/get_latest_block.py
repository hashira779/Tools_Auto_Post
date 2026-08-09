import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.1.0.11', username='ubuntu-server', password='pTT!CT01', timeout=10)

cmd = '''
for f in $(ls -t /home/ubuntu-server/actions-runner/_diag/blocks/* | head -n 3); do
    echo "=== FILE: $f ==="
    tail -n 60 "$f"
done
'''
stdin, stdout, stderr = client.exec_command(cmd)
print(stdout.read().decode())
print(stderr.read().decode())
client.close()

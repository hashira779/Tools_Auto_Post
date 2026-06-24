"""
Auto Post Bot - Quick Update (Sync + Rebuild + Restart)

Fast deployment: syncs changed files and restarts the Docker container.
Use this after making code changes locally.

Usage:
    python update.py
"""

import paramiko
import os
import sys
import time

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# --- Server Configuration ---
HOST = "10.1.0.11"
USER = "ubuntu-server"
PASSWORD = "pTT!CT01"
REMOTE_DIR = "/home/ubuntu-server/AUTO_POST"
LOCAL_DIR = os.path.dirname(os.path.abspath(__file__))

IGNORE_DIRS = {'.venv', '.git', '__pycache__', 'downloads', '.gemini'}
IGNORE_FILES = {
    'deploy.tar.gz', 'auto_post.log', 'deploy_docker.py',
    'deploy.py', 'deploy_docker.bat', 'setup_ubuntu.sh',
    'update.py', 'uploaded_videos.json',
}


def run_ssh(ssh, cmd, sudo=False):
    if sudo:
        full_cmd = f"sudo -S {cmd}"
    else:
        full_cmd = cmd

    print(f"  > {full_cmd[:100]}")
    stdin, stdout, stderr = ssh.exec_command(full_cmd, timeout=600)

    if sudo:
        stdin.write(PASSWORD + '\n')
        stdin.flush()

    output_lines = []
    while True:
        line = stdout.readline()
        if not line:
            break
        print(f"    {line}", end="")
        output_lines.append(line.strip())

    exit_status = stdout.channel.recv_exit_status()
    err = stderr.read().decode().strip()

    if exit_status != 0 and err:
        err_filtered = "\n".join(
            l for l in err.split("\n")
            if "[sudo]" not in l and "password" not in l.lower()
        )
        if err_filtered:
            print(f"    WARN: {err_filtered}")

    return exit_status, "\n".join(output_lines), err


def sftp_mkdir_recursive(sftp, remote_path):
    dirs_to_create = []
    path = remote_path
    while True:
        try:
            sftp.stat(path)
            break
        except IOError:
            dirs_to_create.append(path)
            path = os.path.dirname(path)
            if path == "/" or path == "":
                break
    for d in reversed(dirs_to_create):
        try:
            sftp.mkdir(d)
        except IOError:
            pass


def sync_files(ssh):
    print("\n[1/3] Syncing files...")
    sftp = ssh.open_sftp()
    file_count = 0

    for root, dirs, files in os.walk(LOCAL_DIR):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

        rel_path = os.path.relpath(root, LOCAL_DIR)
        if rel_path == ".":
            remote_path = REMOTE_DIR
        else:
            remote_path = f"{REMOTE_DIR}/{rel_path.replace(os.sep, '/')}"
            sftp_mkdir_recursive(sftp, remote_path)

        for f in files:
            if f in IGNORE_FILES:
                continue
            local_file = os.path.join(root, f)
            remote_file = f"{remote_path}/{f}"
            rel_display = os.path.relpath(local_file, LOCAL_DIR)
            print(f"  {rel_display}")
            sftp.put(local_file, remote_file)
            file_count += 1

    sftp.close()
    print(f"  -> {file_count} files synced")


def rebuild_and_restart(ssh):
    print("\n[2/3] Rebuilding Docker image...")
    exit_code, _, err = run_ssh(
        ssh,
        f"bash -c 'cd {REMOTE_DIR} && docker compose up -d --build'",
        sudo=True
    )
    if exit_code != 0:
        print(f"\n  FAILED! Check errors above.")
        return False
    return True


def show_status(ssh):
    print("\n[3/3] Status check...")
    time.sleep(3)
    run_ssh(ssh, f"bash -c 'cd {REMOTE_DIR} && docker compose ps'", sudo=True)
    print("\n  Latest logs:")
    run_ssh(ssh, f"bash -c 'cd {REMOTE_DIR} && docker compose logs --tail=15'", sudo=True)


def main():
    start = time.time()
    print("=" * 50)
    print("  Quick Update - Sync + Rebuild + Restart")
    print("=" * 50)

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        ssh.connect(HOST, username=USER, password=PASSWORD, timeout=15)
        print(f"  Connected to {HOST}")
    except Exception as e:
        print(f"  Connection failed: {e}")
        sys.exit(1)

    try:
        # Fix ownership first
        run_ssh(ssh, f"chown -R {USER}:{USER} {REMOTE_DIR}", sudo=True)

        sync_files(ssh)
        success = rebuild_and_restart(ssh)

        if success:
            show_status(ssh)

        elapsed = time.time() - start
        print(f"\n{'='*50}")
        if success:
            print(f"  DONE! Updated in {elapsed:.0f}s")
        else:
            print(f"  FAILED after {elapsed:.0f}s")
        print(f"{'='*50}\n")

    finally:
        ssh.close()


if __name__ == "__main__":
    main()

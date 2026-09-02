#!/usr/bin/env python3
"""
camtech — unified ops CLI for the CamTech cluster.

Replaces the old one-off scripts (check_*.py, fetch_*.py, deploy_*.py, ...)
with a single tool. Credentials come from environment variables or
~/.camtech_env — they are NEVER hardcoded.

Environment variables (or ~/.camtech_env with KEY=VALUE lines):
    CAMTECH_HOST        Main server IP        (e.g. 10.1.0.11)
    CAMTECH_USER        SSH username          (e.g. ubuntu-server)
    CAMTECH_PASS        SSH/sudo password     (or use CAMTECH_KEY)
    CAMTECH_KEY         Path to SSH private key (preferred over password)
    CAMTECH_ORS_HOSTS   Comma-separated worker IPs (e.g. 10.2.7.252)

Usage:
    python3 scripts/camtech.py status            # docker ps + disk + memory
    python3 scripts/camtech.py logs <container>  # tail container logs
    python3 scripts/camtech.py disk              # disk usage report
    python3 scripts/camtech.py gpu               # GPU status (all nodes)
    python3 scripts/camtech.py health            # hit /health on all services
    python3 scripts/camtech.py deploy            # trigger production deploy
    python3 scripts/camtech.py exec "<command>"  # run arbitrary command
    python3 scripts/camtech.py --host 10.2.7.252 status   # target a worker
"""

import argparse
import os
import sys
from pathlib import Path


# ── Config loading ───────────────────────────────────────────────

def load_env_file():
    """Load ~/.camtech_env if present (KEY=VALUE lines, # comments)."""
    env_file = Path.home() / ".camtech_env"
    if not env_file.exists():
        return
    for line in env_file.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip())


def get_config(args):
    load_env_file()
    host = args.host or os.environ.get("CAMTECH_HOST")
    user = os.environ.get("CAMTECH_USER")
    password = os.environ.get("CAMTECH_PASS")
    key_path = os.environ.get("CAMTECH_KEY")

    missing = []
    if not host:
        missing.append("CAMTECH_HOST (or --host)")
    if not user:
        missing.append("CAMTECH_USER")
    if not password and not key_path:
        missing.append("CAMTECH_PASS or CAMTECH_KEY")
    if missing:
        print("❌ Missing configuration:", ", ".join(missing))
        print("   Set env vars or create ~/.camtech_env (see --help).")
        sys.exit(2)
    return host, user, password, key_path


# ── SSH helper ───────────────────────────────────────────────────

def ssh_run(host, user, password, key_path, commands, timeout=15, max_output=4000):
    """Run commands over SSH and stream output."""
    try:
        import paramiko
    except ImportError:
        print("❌ paramiko not installed: pip install paramiko")
        sys.exit(2)

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    connect_kwargs = {"username": user, "timeout": timeout}
    if key_path:
        connect_kwargs["key_filename"] = os.path.expanduser(key_path)
    else:
        connect_kwargs["password"] = password

    try:
        client.connect(host, **connect_kwargs)
        for cmd in commands:
            print(f"\n─── [{host}] {cmd} " + "─" * max(0, 40 - len(cmd)))
            _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
            out = stdout.read().decode(errors="replace").strip()
            err = stderr.read().decode(errors="replace").strip()
            if out:
                print(out[:max_output])
            if err:
                print("[stderr]", err[:1000])
    finally:
        client.close()


def sudo(cmd, password):
    """Wrap a command with sudo, feeding the password via stdin (not argv)."""
    # -S reads password from stdin; printf avoids putting it in `ps` output
    return f"printf '%s\\n' \"$CAMTECH_SUDO_PASS\" | sudo -S {cmd}" if not password else f"echo {shell_quote(password)} | sudo -S {cmd}"


def shell_quote(s):
    return "'" + s.replace("'", "'\\''") + "'"


# ── Commands ─────────────────────────────────────────────────────

def cmd_status(cfg, _args):
    host, user, password, key = cfg
    ssh_run(host, user, password, key, [
        sudo("docker ps --format 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}'", password),
        "df -h / | tail -1",
        "free -m | head -2",
        "uptime",
    ])


def cmd_logs(cfg, args):
    host, user, password, key = cfg
    n = args.lines
    ssh_run(host, user, password, key, [
        sudo(f"docker logs --tail {n} {shell_quote(args.container)}", password),
    ], timeout=30, max_output=12000)


def cmd_disk(cfg, _args):
    host, user, password, key = cfg
    ssh_run(host, user, password, key, [
        "df -h",
        sudo("docker system df", password),
        sudo("du -sh /var/lib/docker 2>/dev/null", password),
    ])


def cmd_gpu(cfg, args):
    host, user, password, key = cfg
    hosts = [host]
    ors = os.environ.get("CAMTECH_ORS_HOSTS", "")
    if args.all and ors:
        hosts += [h.strip() for h in ors.split(",") if h.strip()]
    for h in hosts:
        ssh_run(h, user, password, key, [
            "nvidia-smi --query-gpu=name,memory.used,memory.total,utilization.gpu --format=csv 2>/dev/null || echo 'no GPU / driver'",
        ])


def cmd_health(cfg, _args):
    """Check /health endpoints of all services through the gateway."""
    host, user, password, key = cfg
    endpoints = [
        ("savemedia-api", "http://localhost:80/api/health"),
        ("sticker-api", "http://localhost:80/api/sticker/health"),
        ("screen-share", "http://localhost:80/socket.io/?EIO=4&transport=polling"),
        ("frontend", "http://localhost:80/"),
    ]
    cmds = [
        f"echo -n '{name}: ' && curl -s -o /dev/null -w '%{{http_code}}' -m 5 {url} && echo ''"
        for name, url in endpoints
    ]
    ssh_run(host, user, password, key, cmds, timeout=30)


def cmd_deploy(cfg, _args):
    host, user, password, key = cfg
    print("🚀 Triggering production deploy (git pull + compose up)...")
    ssh_run(host, user, password, key, [
        "cd ~/actions-runner/_work/*/ 2>/dev/null || cd ~/CamTech; git fetch --all && git reset --hard origin/main && bash scripts/deploy_production.sh",
    ], timeout=1800, max_output=20000)


def cmd_exec(cfg, args):
    host, user, password, key = cfg
    ssh_run(host, user, password, key, [args.command], timeout=args.timeout, max_output=20000)


# ── Main ─────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        prog="camtech",
        description="CamTech cluster ops CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__.split("Usage:")[1] if "Usage:" in __doc__ else "",
    )
    parser.add_argument("--host", help="Target host (default: $CAMTECH_HOST)")
    sub = parser.add_subparsers(dest="cmd", required=True)

    sub.add_parser("status", help="docker ps + disk + memory + uptime")

    p_logs = sub.add_parser("logs", help="tail container logs")
    p_logs.add_argument("container")
    p_logs.add_argument("-n", "--lines", type=int, default=100)

    sub.add_parser("disk", help="disk usage report")

    p_gpu = sub.add_parser("gpu", help="GPU status")
    p_gpu.add_argument("--all", action="store_true", help="include ORS workers")

    sub.add_parser("health", help="hit /health on all services")
    sub.add_parser("deploy", help="trigger production deploy")

    p_exec = sub.add_parser("exec", help="run arbitrary command")
    p_exec.add_argument("command")
    p_exec.add_argument("--timeout", type=int, default=60)

    args = parser.parse_args()
    cfg = get_config(args)

    handlers = {
        "status": cmd_status,
        "logs": cmd_logs,
        "disk": cmd_disk,
        "gpu": cmd_gpu,
        "health": cmd_health,
        "deploy": cmd_deploy,
        "exec": cmd_exec,
    }
    handlers[args.cmd](cfg, args)


if __name__ == "__main__":
    main()

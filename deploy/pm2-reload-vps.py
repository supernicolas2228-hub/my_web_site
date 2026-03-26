#!/usr/bin/env python3
"""Только PM2 reload на VPS (подхват .env после правок на сервере)."""
import sys

import paramiko

HOST = "138.124.90.218"
USER = "root"
PWD = "1kRPeZQ4FbQVkZ1I"
REMOTE_PATH = "/var/www/business-card-site"


def main() -> None:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PWD, timeout=60)
    cmd = (
        f"set -e; cd '{REMOTE_PATH}' && "
        "pm2 reload ecosystem.config.cjs --update-env && pm2 save && "
        "curl -sI http://127.0.0.1:3000/ | head -n1"
    )
    stdin, stdout, stderr = client.exec_command(cmd, get_pty=True)
    out = stdout.read().decode("utf-8", "replace")
    err = stderr.read().decode("utf-8", "replace")
    sys.stdout.buffer.write(out.encode("utf-8", "replace"))
    if err.strip():
        sys.stdout.buffer.write(("STDERR: " + err).encode("utf-8", "replace"))
    code = stdout.channel.recv_exit_status()
    client.close()
    raise SystemExit(code)


if __name__ == "__main__":
    main()

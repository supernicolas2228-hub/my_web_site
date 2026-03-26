#!/usr/bin/env python3
"""Pack project, upload to VPS, run server-build.sh."""
import os
import sys
import tarfile
import tempfile
from pathlib import Path

import paramiko

HOST = "138.124.90.218"
USER = "root"
PWD = "1kRPeZQ4FbQVkZ1I"
PROJECT = Path(__file__).resolve().parent.parent
REMOTE_PATH = "/var/www/business-card-site"
REMOTE_ARCHIVE = "/tmp/truweb-deploy.tar.gz"
# data/ — SQLite на сервере; не включать, иначе локальный app.db затирает продакшен-данные (клиенты, заказы).
EXCLUDE = {"node_modules", ".next", ".git", "data"}


def main() -> None:
    fd, tar_path = tempfile.mkstemp(suffix=".tar.gz", prefix="truweb-deploy-")
    os.close(fd)
    try:
        with tarfile.open(tar_path, "w:gz") as tar:
            for root, dirs, files in os.walk(PROJECT):
                rel_root = Path(root).relative_to(PROJECT)
                dirs[:] = [d for d in dirs if d not in EXCLUDE]
                if any(p in EXCLUDE for p in rel_root.parts):
                    continue
                for f in files:
                    p = Path(root) / f
                    rel = p.relative_to(PROJECT)
                    if any(p in EXCLUDE for p in rel.parts):
                        continue
                    tar.add(p, arcname=str(rel))

        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(HOST, username=USER, password=PWD, timeout=60)
        sftp = client.open_sftp()
        sftp.put(tar_path, REMOTE_ARCHIVE)
        sftp.close()

        cmd = f"""set -e
mkdir -p '{REMOTE_PATH}'
cd '{REMOTE_PATH}'
tar -xzf '{REMOTE_ARCHIVE}'
rm -f '{REMOTE_ARCHIVE}'
chmod +x deploy/server-build.sh
bash deploy/server-build.sh
curl -sI http://127.0.0.1:3000/admin/login | head -n1 || true
"""
        stdin, stdout, stderr = client.exec_command(cmd, get_pty=True)
        out = stdout.read().decode("utf-8", "replace")
        err = stderr.read().decode("utf-8", "replace")
        sys.stdout.buffer.write(out.encode("utf-8", "replace"))
        if err.strip():
            sys.stdout.buffer.write(b"STDERR: ")
            sys.stdout.buffer.write(err.encode("utf-8", "replace"))
        code = stdout.channel.recv_exit_status()
        sys.stdout.buffer.write(f"\nremote_exit: {code}\n".encode("ascii"))
        client.close()
        raise SystemExit(code)
    finally:
        try:
            os.remove(tar_path)
        except OSError:
            pass


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Pack project, upload to VPS, run server-build.sh."""
import os
import sys
import tarfile
import tempfile
from pathlib import Path

import paramiko

PROJECT = Path(__file__).resolve().parent.parent


def _load_local_deploy_env() -> None:
    """Подхватывает TRUWEB_* из .deploy.env в корне проекта (файл в .gitignore)."""
    path = PROJECT / ".deploy.env"
    if not path.is_file():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        key, val = key.strip(), val.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = val


_load_local_deploy_env()

HOST = os.environ.get("TRUWEB_VPS_HOST", "138.124.90.218")
USER = os.environ.get("TRUWEB_VPS_USER", "root")
PWD = os.environ.get("TRUWEB_VPS_SSH_PASSWORD", "")
REMOTE_PATH = "/var/www/business-card-site"
REMOTE_ARCHIVE = "/tmp/truweb-deploy.tar.gz"
# data/ — SQLite на сервере; не включать, иначе локальный app.db затирает продакшен-данные (клиенты, заказы).
EXCLUDE = {"node_modules", ".next", ".git", "data"}


def main() -> None:
    if not PWD.strip():
        print(
            "Задайте TRUWEB_VPS_SSH_PASSWORD в переменной окружения или в файле .deploy.env в корне проекта (см. .deploy.env.example).",
            file=sys.stderr,
        )
        raise SystemExit(1)
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

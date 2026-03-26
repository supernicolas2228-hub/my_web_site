#!/usr/bin/env python3
"""One-off: sync ADMIN_* to VPS .env, reset admin_users, pm2 reload."""
import sys
import textwrap

import paramiko

HOST = "138.124.90.218"
USER = "root"
PWD = "1kRPeZQ4FbQVkZ1I"
REMOTE = "/var/www/business-card-site"
ADMIN_EMAIL = "supernicolas2228@gmail.com"
ADMIN_PW = "TwAdmin!9Kq4#Lm2Pz7"


def main() -> None:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PWD, timeout=25)

    sftp = client.open_sftp()
    try:
        with sftp.open(f"{REMOTE}/.env", "r") as f:
            content = f.read().decode("utf-8", "replace")
    except OSError:
        content = ""
    sftp.close()

    lines_out: list[str] = []
    seen_email = False
    seen_pass = False
    for line in content.splitlines():
        if line.strip().startswith("ADMIN_EMAIL="):
            lines_out.append(f"ADMIN_EMAIL={ADMIN_EMAIL}")
            seen_email = True
        elif line.strip().startswith("ADMIN_PASSWORD="):
            lines_out.append(f"ADMIN_PASSWORD={ADMIN_PW}")
            seen_pass = True
        else:
            lines_out.append(line)
    if not seen_email:
        lines_out.append(f"ADMIN_EMAIL={ADMIN_EMAIL}")
    if not seen_pass:
        lines_out.append(f"ADMIN_PASSWORD={ADMIN_PW}")
    new_env = "\n".join(lines_out).rstrip() + "\n"

    sftp = client.open_sftp()
    with sftp.open(f"{REMOTE}/.env", "w") as wf:
        wf.write(new_env.encode("utf-8"))
    sftp.close()

    cmd = textwrap.dedent(
        rf"""
        set -e
        cd {REMOTE}
        node -e "const Database=require('better-sqlite3'); const db=new Database('data/app.db'); try {{ db.exec('DELETE FROM admin_sessions'); db.exec('DELETE FROM admin_users'); }} catch (e) {{ console.error(e.message); process.exit(0); }}"
        pm2 reload ecosystem.config.cjs --update-env
        sleep 2
        curl -sI http://127.0.0.1:3000/admin/login | head -n1
        """
    ).strip()
    stdin, stdout, stderr = client.exec_command(cmd, get_pty=True)
    out = stdout.read().decode("utf-8", "replace")
    err = stderr.read().decode("utf-8", "replace")
    sys.stdout.buffer.write(out.encode("utf-8", "replace"))
    if err.strip():
        sys.stdout.buffer.write(b"STDERR: ")
        sys.stdout.buffer.write(err.encode("utf-8", "replace"))
    code = stdout.channel.recv_exit_status()
    sys.stdout.buffer.write(f"\nexit_code: {code}\n".encode("ascii", "replace"))
    client.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print("ERROR:", e)
        raise SystemExit(1) from e

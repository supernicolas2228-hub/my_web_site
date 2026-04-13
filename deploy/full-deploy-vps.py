#!/usr/bin/env python3
"""Pack project, upload to VPS, run server-build.sh.

Регион (этап 2 — два сервера):
  python deploy/full-deploy-vps.py        # EU — TRUWEB_VPS_HOST (как раньше)
  python deploy/full-deploy-vps.py ru     # RU — TRUWEB_VPS_HOST_RU

Или переменная окружения: TRUWEB_DEPLOY_REGION=ru
"""
from __future__ import annotations

import os
import sys
import tarfile
import tempfile
from dataclasses import dataclass
from pathlib import Path

import paramiko

PROJECT = Path(__file__).resolve().parent.parent

RU_REGIONS = frozenset({"ru", "rf", "mow", "moscow"})


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


def _region_arg() -> str:
    if len(sys.argv) > 1:
        return sys.argv[1].strip().lower()
    return os.environ.get("TRUWEB_DEPLOY_REGION", "eu").strip().lower()


@dataclass(frozen=True)
class DeployTarget:
    host: str
    user: str
    password: str
    ssh_key_override: str  # пусто = как у основного eu
    label: str


def resolve_target(region: str) -> DeployTarget:
    if region in RU_REGIONS:
        host = os.environ.get("TRUWEB_VPS_HOST_RU", "").strip()
        if not host:
            print(
                "Регион RU: укажите в .deploy.env TRUWEB_VPS_HOST_RU (IP Москвы).\n"
                "Опционально: TRUWEB_VPS_USER_RU, TRUWEB_VPS_SSH_KEY_RU, TRUWEB_VPS_SSH_PASSWORD_RU.",
                file=sys.stderr,
            )
            raise SystemExit(1)
        user = os.environ.get("TRUWEB_VPS_USER_RU", os.environ.get("TRUWEB_VPS_USER", "root")).strip()
        pwd = os.environ.get("TRUWEB_VPS_SSH_PASSWORD_RU", os.environ.get("TRUWEB_VPS_SSH_PASSWORD", "")).strip()
        key = os.environ.get("TRUWEB_VPS_SSH_KEY_RU", "").strip()
        return DeployTarget(host=host, user=user, password=pwd, ssh_key_override=key, label="RU (Москва)")

    host = os.environ.get("TRUWEB_VPS_HOST", "138.124.90.218").strip()
    user = os.environ.get("TRUWEB_VPS_USER", "root").strip()
    pwd = os.environ.get("TRUWEB_VPS_SSH_PASSWORD", "").strip()
    return DeployTarget(host=host, user=user, password=pwd, ssh_key_override="", label="EU (основной)")


REMOTE_PATH = "/var/www/business-card-site"
REMOTE_ARCHIVE = "/tmp/truweb-deploy.tar.gz"
EXCLUDE = {"node_modules", ".next", ".git", "data"}


def _ssh_key_candidates(ssh_key_override: str) -> list[Path]:
    out: list[Path] = []
    if ssh_key_override.strip():
        out.append(Path(ssh_key_override).expanduser())
    primary = os.environ.get("TRUWEB_VPS_SSH_KEY", "").strip()
    if primary:
        out.append(Path(primary).expanduser())
    ssh_dir = Path.home() / ".ssh"
    for name in ("id_ed25519", "id_rsa", "id_ecdsa", "id_ed25519_aeza_vps"):
        p = ssh_dir / name
        if p.is_file():
            out.append(p)
    seen: set[str] = set()
    uniq: list[Path] = []
    for p in out:
        s = str(p.resolve()) if p.exists() else str(p)
        if s not in seen:
            seen.add(s)
            uniq.append(p)
    return uniq


def ssh_connect(client: paramiko.SSHClient, target: DeployTarget) -> None:
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    errors: list[str] = []
    for kp in _ssh_key_candidates(target.ssh_key_override):
        if not kp.is_file():
            continue
        try:
            client.connect(
                target.host,
                username=target.user,
                key_filename=str(kp),
                timeout=90,
                look_for_keys=False,
                allow_agent=False,
            )
            return
        except Exception as e:  # noqa: BLE001
            errors.append(f"{kp}: {e}")
    if target.password.strip():
        try:
            client.connect(
                target.host,
                username=target.user,
                password=target.password,
                timeout=90,
                look_for_keys=False,
                allow_agent=False,
            )
            return
        except Exception as e:  # noqa: BLE001
            errors.append(f"password: {e}")
    print(
        "SSH: не удалось войти. Добавьте в .deploy.env ключ: TRUWEB_VPS_SSH_KEY=...\n"
        "Для RU при другом ключе: TRUWEB_VPS_SSH_KEY_RU=...\n"
        "или пароль TRUWEB_VPS_SSH_PASSWORD (или _RU).",
        file=sys.stderr,
    )
    for line in errors[-5:]:
        print(line, file=sys.stderr)
    raise SystemExit(1)


def main() -> None:
    region = _region_arg()
    target = resolve_target(region)
    print(f"==> Деплой: {target.label} → {target.host}\n", file=sys.stderr)

    keys = _ssh_key_candidates(target.ssh_key_override)
    if not target.password.strip() and not any(p.is_file() for p in keys):
        print(
            "Нужен доступ по SSH: ключ в ~/.ssh или TRUWEB_VPS_SSH_KEY в .deploy.env — см. .deploy.env.example.",
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
                    if any(part in EXCLUDE for part in rel.parts):
                        continue
                    tar.add(p, arcname=str(rel))

        client = paramiko.SSHClient()
        ssh_connect(client, target)
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

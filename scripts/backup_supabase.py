#!/usr/bin/env python3
"""
Daily backup of the Kunokhanya Supabase database.

Exports every row from students, courses, payments, and profiles into a
single timestamped JSON file. Run automatically by the launchd job installed
at ~/Library/LaunchAgents/com.kunokhanya.supabase-backup.plist, or manually:

    python3 scripts/backup_supabase.py

Prunes backups older than 60 days so the folder doesn't grow forever.
"""
import json
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import requests

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = PROJECT_ROOT / ".env.local"
BACKUP_DIR = Path(
    "/Users/kudzaishava/Library/CloudStorage/GoogleDrive-klshava97@gmail.com/My Drive/KTA-Backups"
)
RETENTION_DAYS = 60
TABLES = ["students", "courses", "payments", "profiles"]
PAGE_SIZE = 1000


def load_env():
    env = {}
    with open(ENV_FILE) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            env[key] = value
    return env


def fetch_all(base_url, headers, table):
    rows = []
    offset = 0
    while True:
        resp = requests.get(
            f"{base_url}/rest/v1/{table}",
            headers={**headers, "Range": f"{offset}-{offset + PAGE_SIZE - 1}"},
            params={"select": "*", "order": list(_primary_key(table))[0]},
            timeout=30,
        )
        resp.raise_for_status()
        batch = resp.json()
        rows.extend(batch)
        if len(batch) < PAGE_SIZE:
            break
        offset += PAGE_SIZE
    return rows


def _primary_key(table):
    return {
        "students": ["student_id"],
        "courses": ["course_id"],
        "payments": ["payment_id"],
        "profiles": ["id"],
    }[table]


def prune_old_backups():
    cutoff = datetime.now(timezone.utc) - timedelta(days=RETENTION_DAYS)
    for f in BACKUP_DIR.glob("kta-backup-*.json"):
        try:
            stamp = f.stem.replace("kta-backup-", "")
            file_date = datetime.strptime(stamp, "%Y-%m-%d_%H%M%S").replace(tzinfo=timezone.utc)
            if file_date < cutoff:
                f.unlink()
                print(f"pruned old backup: {f.name}")
        except ValueError:
            continue


def main():
    env = load_env()
    base_url = env["NEXT_PUBLIC_SUPABASE_URL"]
    service_key = env["SUPABASE_SERVICE_ROLE_KEY"]
    headers = {"apikey": service_key, "Authorization": f"Bearer {service_key}"}

    BACKUP_DIR.mkdir(parents=True, exist_ok=True)

    snapshot = {"taken_at": datetime.now(timezone.utc).isoformat(), "tables": {}}
    for table in TABLES:
        rows = fetch_all(base_url, headers, table)
        snapshot["tables"][table] = rows
        print(f"{table}: {len(rows)} rows")

    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d_%H%M%S")
    out_path = BACKUP_DIR / f"kta-backup-{timestamp}.json"
    with open(out_path, "w") as f:
        json.dump(snapshot, f, indent=2, default=str)

    print(f"wrote {out_path}")
    prune_old_backups()


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"BACKUP FAILED: {e}", file=sys.stderr)
        sys.exit(1)

#!/bin/bash
# KINEXIS — Manual database backup script
# Usage: ./scripts/backup-db.sh
# Requires: SUPABASE_DB_URL env variable or .env file in project root

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_ROOT/backups"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="kinexis_backup_$DATE.sql"

# Load env if available
if [ -f "$PROJECT_ROOT/.env" ]; then
  export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
fi

if [ -z "${SUPABASE_DB_URL:-}" ]; then
  echo "ERROR: SUPABASE_DB_URL is not set"
  echo "Set it in your .env file or export it before running:"
  echo "  export SUPABASE_DB_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"
  exit 1
fi

mkdir -p "$BACKUP_DIR"

echo "Starting backup..."
pg_dump "$SUPABASE_DB_URL" \
  --no-owner \
  --no-acl \
  --format=plain \
  > "$BACKUP_DIR/$FILENAME"

SIZE=$(du -h "$BACKUP_DIR/$FILENAME" | cut -f1)
echo "Backup created: $BACKUP_DIR/$FILENAME ($SIZE)"

# Keep only last 7 backups locally
ls -t "$BACKUP_DIR"/kinexis_backup_*.sql | tail -n +8 | xargs -r rm --
echo "Old backups cleaned. Keeping last 7."

#!/bin/bash
set -e

echo "Restoring database from dump file..."
pg_restore --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" /docker-entrypoint-initdb.d/socone_schemas_bot.dump
echo "Database restored successfully!"

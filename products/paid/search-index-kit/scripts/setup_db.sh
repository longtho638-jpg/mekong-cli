#!/bin/bash
# setup_db.sh
# Simple script to create the database for local development

DB_NAME="search_db"
DB_USER="user"
DB_PASSWORD="password"

echo "Creating database $DB_NAME..."
createdb $DB_NAME

echo "Creating user $DB_USER..."
psql postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

echo "Enabling pg_trgm extension..."
psql $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"

echo "Done. Please update .env in backend/ folder if you changed defaults."

#!/usr/bin/env python3
"""
Apply Migration Script
======================
Executes a SQL migration file against the configured Supabase database.

Usage:
    python3 scripts/apply_migration.py supabase/migrations/20260127_advanced_webhooks.sql
"""

import argparse
import os
import sys

from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Ensure we can import from core
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from supabase import Client, create_client


def get_db_client() -> Client:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

    if not url or not key:
        print("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env")
        sys.exit(1)

    return create_client(url, key)

def apply_migration(file_path: str):
    if not os.path.exists(file_path):
        print(f"❌ Error: File not found: {file_path}")
        sys.exit(1)

    print(f"🚀 Applying migration: {file_path}")

    with open(file_path, 'r') as f:
        sql = f.read()

    # Split by statements if necessary, but supabase-py's rpc or direct SQL execution
    # might vary. The 'postgrest' client typically doesn't support raw SQL execution
    # unless enabled via a stored procedure or using a driver like psycopg2.
    # However, Supabase-py client often connects via REST.
    #
    # If we are using the python client, we might not be able to execute RAW SQL
    # directly if the 'postgres' extension/function isn't set up.
    #
    # LET'S CHECK if there is a 'exec_sql' function or similar exposed,
    # or if we should use psycopg2 if available.

    # Checking if psycopg2 is installed or if we can use a widely used 'exec_sql' RPC pattern.
    # Many Supabase setups have an 'exec_sql' or 'exec' RPC function for this purpose.

    client = get_db_client()

    # Method 1: Try RPC 'exec_sql' (common pattern)
    try:
        _ = client.rpc('exec_sql', {'sql_query': sql}).execute()
        print("✅ Migration applied via RPC 'exec_sql'")
        return
    except Exception as e:
        print(f"⚠️  RPC 'exec_sql' failed: {e}")
        # Proceed to Method 2

    # Method 2: If local postgres is accessible via URL, use psycopg2
    # But usually SUPABASE_URL is an HTTP URL.
    # We need the DB_URL (postgres://...) for psycopg2.

    db_url = os.getenv("DATABASE_URL") or os.getenv("DB_URL")
    if db_url:
        try:
            import psycopg2
            print("🔌 Connecting to DB via psycopg2...")
            conn = psycopg2.connect(db_url)
            cur = conn.cursor()
            cur.execute(sql)
            conn.commit()
            cur.close()
            conn.close()
            print("✅ Migration applied via psycopg2")
            return
        except ImportError:
            print("⚠️  psycopg2 not installed.")
        except Exception as e:
            print(f"❌ psycopg2 execution failed: {e}")

    print("❌ Could not apply migration. Please run the SQL manually or ensure 'exec_sql' RPC function exists or DATABASE_URL is set.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/apply_migration.py <path_to_sql_file>")
        sys.exit(1)

    apply_migration(sys.argv[1])

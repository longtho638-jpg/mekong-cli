# Database Agent Documentation

The Database Agent is a component of the Mekong CLI that provides database operations capabilities. It supports various database operations including connecting to databases, executing queries, running migrations, and managing database schemas.

## Features

- **Connect**: Connect to different database types (SQLite, PostgreSQL, MySQL, MongoDB)
- **Query**: Execute SQL queries (SELECT, INSERT, UPDATE, DELETE)
- **Migrate**: Run database migrations from specified paths
- **Schema**: Inspect database schema and table structures
- **Backup/Restore**: Backup and restore database content

## Usage

The Database Agent can be used through the Mekong CLI with the following commands:

### Connecting to a Database

```bash
mekong agent database connect [DATABASE_URL]
```

Supported database URLs:
- `sqlite:///path/to/database.db` - SQLite database
- `postgresql://user:password@host:port/database` - PostgreSQL database
- `mysql://user:password@host:port/database` - MySQL database
- `mongodb://user:password@host:port/database` - MongoDB database

### Executing Queries

```bash
mekong agent database query "SELECT * FROM table_name"
mekong agent database query "INSERT INTO table_name (col1, col2) VALUES ('val1', 'val2')"
mekong agent database query "UPDATE table_name SET col1='new_value' WHERE id=1"
mekong agent database query "DELETE FROM table_name WHERE id=1"
```

### Running Migrations

```bash
mekong agent database migrate [PATH_TO_MIGRATIONS]
```

If no path is provided, it defaults to `./migrations`.

### Checking Schema

```bash
mekong agent database schema [TABLE_NAME]
```

If no table name is provided, it lists all tables in the database.

### Backup and Restore

```bash
mekong agent database backup [PATH_TO_BACKUP_FILE]
mekong agent database restore [PATH_TO_BACKUP_FILE]
```

If no path is provided, backup defaults to `./backup.sql`.

## Examples

### Example 1: Connect to SQLite and query data

```bash
mekong agent database connect sqlite:///example.db
mekong agent database query "SELECT * FROM users LIMIT 10"
```

### Example 2: Create a table and insert data

```bash
mekong agent database query "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT)"
mekong agent database query "INSERT INTO users (name, email) VALUES ('John Doe', 'john@example.com')"
```

### Example 3: Backup database

```bash
mekong agent database backup ./my_backup.sql
```

## Architecture

The Database Agent follows the Plan-Execute-Verify pattern used throughout the Mekong CLI:

1. **Plan**: Parse the command string into specific database tasks
2. **Execute**: Execute the database operations
3. **Verify**: Validate the results of the operations

The agent maintains a connection to the database for the duration of operations and properly handles cleanup when needed.

## Supported Databases

Currently, the Database Agent primarily supports SQLite through the built-in Python `sqlite3` module. Support for PostgreSQL, MySQL, and MongoDB can be extended by adding appropriate database drivers and connection logic.
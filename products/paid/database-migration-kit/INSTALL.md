# Installation Guide

## Prerequisites
- Python 3.9 or higher
- pip (Python Package Manager)

## Installation via PIP

You can install the Database Migration Kit directly from the package (once published) or from source.

### From Source
1. Clone the repository or extract the package.
2. Navigate to the directory.
3. Install dependencies:

```bash
pip install .
```

For specific database drivers:

```bash
# PostgreSQL
pip install ".[postgres]"

# MySQL
pip install ".[mysql]"
```

## Configuration

Run `dmk init` to generate the default `dmk.toml` configuration file.

```toml
[migrations]
dir = "migrations"

[seeds]
dir = "seeds"

[connections.default]
driver = "sqlite"
database = "db.sqlite"

# Example PostgreSQL
[connections.production]
driver = "postgres"
host = "localhost"
port = 5432
username = "user"
password = "password"
database = "mydb"
```

## Environment Variables
You can also use environment variables in your `dmk.toml` (not supported natively yet in the TOML loader but recommended practice is to generate the TOML or modify the loader).

*Note: The current version supports basic string replacement if implemented, or you can manual edit `dmk.toml`.*

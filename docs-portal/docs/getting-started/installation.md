---
sidebar_position: 1
---

# Installation

Get started with AgencyOS in under 5 minutes.

## Prerequisites

- **Node.js**: v20 or higher
- **Python**: v3.11 or higher
- **PostgreSQL**: v15 or higher
- **Redis**: v7 or higher

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/agencyos/agencyos.git
cd agencyos
```

### 2. Install Dependencies

**Backend:**
```bash
# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install requirements
pip install -r requirements.txt
```

**Frontend:**
```bash
# Install Node modules
npm install
```

### 3. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:
```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DB=agencyos
```

### 4. Run Migrations

```bash
# Apply database migrations
alembic upgrade head
```

### 5. Start Development Server

```bash
# Start the full stack
npm run dev
```

Your application is now running at [http://localhost:3000](http://localhost:3000).

# ⚡ API Boilerplate - FastAPI

> Production-ready Python API with authentication, CRUD, and async support. Deploy anywhere in minutes.

![Python](https://img.shields.io/badge/Python-3.11+-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green)
![Async](https://img.shields.io/badge/Async-Ready-orange)

## ✨ Features

- 🔐 **JWT Authentication** - Secure token-based auth
- 📝 **CRUD Operations** - Generic reusable patterns
- 🗄️ **SQLAlchemy** - Async ORM with migrations
- 📚 **Auto Docs** - Swagger & ReDoc built-in
- ✅ **Validation** - Pydantic models
- 🧪 **Testing** - Pytest setup included
- 🐳 **Docker Ready** - Dockerfile included

## 📦 What's Included

```
api-boilerplate-fastapi/
├── app/
│   ├── main.py           # FastAPI app entry
│   ├── core/
│   │   ├── config.py     # Settings
│   │   ├── security.py   # JWT utils
│   │   └── database.py   # DB connection
│   ├── api/
│   │   ├── v1/
│   │   │   ├── auth.py   # Auth endpoints
│   │   │   └── users.py  # User CRUD
│   │   └── deps.py       # Dependencies
│   ├── models/
│   │   └── user.py       # SQLAlchemy models
│   ├── schemas/
│   │   └── user.py       # Pydantic schemas
│   └── crud/
│       └── user.py       # CRUD operations
├── tests/
│   └── test_auth.py
├── Dockerfile
├── docker-compose.yml
└── requirements.txt
```

## 🚀 Quick Start

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env

# Run development server
uvicorn app.main:app --reload
```

## 📚 API Documentation

Once running, visit:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🔐 Authentication

```python
# POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "secret"
}

# Response
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}
```

## 🐳 Docker Deployment

```bash
# Build and run
docker-compose up -d

# Or build only
docker build -t my-api .
docker run -p 8000:8000 my-api
```

## 📄 License

MIT License - Use commercially, modify freely.

## 🤝 Support

- 📧 Email: billwill.mentor@gmail.com
- 💬 Twitter: @MekongDev

---

Built with ❤️ by MekongDev

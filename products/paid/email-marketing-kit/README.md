# Email Marketing Kit

A powerful, self-hosted email marketing solution for developers and businesses. Build, send, and track email campaigns with ease using your own infrastructure.

## 🚀 Features

*   **Campaign Management**: Create, schedule, and send email campaigns.
*   **Subscriber Management**: Manage subscribers and mailing lists with ease.
*   **Template Engine**: MJML support for responsive emails, plus HTML/Text fallback.
*   **Analytics**: Track opens and clicks in real-time.
*   **Multiple Providers**: Support for SMTP, Amazon SES, and SendGrid out of the box.
*   **API-First**: Full REST API for seamless integration with your applications.
*   **Self-Hosted**: Full control over your data and infrastructure.

## 🏁 Quick Start

### Prerequisites

*   Docker and Docker Compose
*   Python 3.11+ (for local development)

### Installation & Running

1.  **Clone the repository** (or unzip the package):
    ```bash
    git clone <repository-url> email-marketing-kit
    cd email-marketing-kit
    ```

2.  **Configure Environment**:
    Copy the example environment file and update it with your settings.
    ```bash
    cp .env.example .env
    ```
    *Edit `.env` to set your Database credentials, Secret Key, and Email Provider settings.*

3.  **Start with Docker Compose**:
    ```bash
    docker-compose up -d --build
    ```

4.  **Run Migrations**:
    ```bash
    docker-compose exec app alembic upgrade head
    ```

5.  **Access the Application**:
    *   API: http://localhost:8000/api/v1
    *   Docs: http://localhost:8000/docs

## 📖 Documentation

*   [API Reference](API.md): Detailed documentation of all API endpoints.
*   [Architecture](ARCHITECTURE.md): System design and component interactions.
*   [Development](DEVELOPMENT.md): Guide for setting up a local development environment.
*   [Deployment](DEPLOYMENT.md): Instructions for production deployment.
*   [Testing](TESTING.md): How to run the test suite.
*   [Security](SECURITY.md): Security best practices and considerations.

## 🛠️ Basic Usage

### 1. Create a Mailing List
```bash
curl -X POST "http://localhost:8000/api/v1/lists/" \
     -H "Content-Type: application/json" \
     -d '{"name": "Newsletter", "description": "Weekly updates"}'
```

### 2. Add a Subscriber
```bash
curl -X POST "http://localhost:8000/api/v1/subscribers/" \
     -H "Content-Type: application/json" \
     -d '{"email": "user@example.com", "first_name": "John", "list_ids": [1]}'
```

### 3. Create a Template
```bash
curl -X POST "http://localhost:8000/api/v1/templates/" \
     -H "Content-Type: application/json" \
     -d '{"name": "Welcome Email", "subject": "Welcome {{first_name}}!", "body_html": "<h1>Hello {{first_name}}</h1>"}'
```

### 4. Send a Campaign
```bash
curl -X POST "http://localhost:8000/api/v1/campaigns/" \
     -H "Content-Type: application/json" \
     -d '{"name": "Launch", "subject": "Big News", "template_id": 1}'
```

## 📄 License

This software is proprietary. Please refer to the license agreement included in your purchase.

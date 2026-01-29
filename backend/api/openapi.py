from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi


def custom_openapi(app: FastAPI):
    def openapi():
        if app.openapi_schema:
            return app.openapi_schema

        openapi_schema = get_openapi(
            title="AgencyOS API",
            version="3.0.0",
            description="""
# AgencyOS API Documentation

Welcome to the comprehensive API documentation for AgencyOS.

## Authentication

AgencyOS supports OAuth 2.0 and JWT authentication.

### OAuth 2.0
Use the standard Authorization Code flow for third-party integrations.

### Bearer Token
Include the JWT token in the `Authorization` header:
`Authorization: Bearer <your_token>`

## Rate Limiting
Standard rate limits apply:
- 1000 requests per hour for free tier
- 10000 requests per hour for pro tier
            """,
            routes=app.routes,
        )

        # Add authentication schemas
        openapi_schema["components"]["securitySchemes"] = {
            "OAuth2": {
                "type": "oauth2",
                "flows": {
                    "authorizationCode": {
                        "authorizationUrl": "/oauth/authorize",
                        "tokenUrl": "/oauth/token",
                        "scopes": {
                            "read:users": "Read user data",
                            "write:users": "Modify user data",
                            "read:projects": "Read project data",
                            "write:projects": "Modify project data",
                        },
                    }
                },
            },
            "BearerAuth": {
                "type": "http",
                "scheme": "bearer",
                "bearerFormat": "JWT",
            },
            "ApiKeyAuth": {
                "type": "apiKey",
                "in": "header",
                "name": "X-API-Key",
                "description": "API Key for server-to-server communication",
            },
        }

        # Apply security globally (optional, or per-route)
        # openapi_schema["security"] = [{"BearerAuth": []}]

        app.openapi_schema = openapi_schema
        return app.openapi_schema

    return openapi

# FastAPI Route Standards

Guidelines for building API endpoints with FastAPI.

## Rules
- Use descriptive path names and HTTP methods.
- Leverage Pydantic models for request bodies and response schemas.
- Use FastAPI's `Depends` for dependency injection (e.g., DB session, Auth).
- Define clear tags for OpenAPI/Swagger documentation.
- Use `status_code` for appropriate HTTP responses (e.g., 201 for Created).
- Handle common errors (404, 400) using `HTTPException`.
- Keep route handlers thin; delegate business logic to service layers.


import json

from backend.main import app

print("Registered Routes:")
for route in app.routes:
    methods = getattr(route, "methods", None)
    path = getattr(route, "path", None)
    if path and "/api/exports" in path:
        print(f"{path} {methods}")

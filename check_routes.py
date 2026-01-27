import json

from backend.main import app

print("Registered Routes:")
for route in app.routes:
    methods = getattr(route, "methods", None)
    print(f"{route.path} {methods}")

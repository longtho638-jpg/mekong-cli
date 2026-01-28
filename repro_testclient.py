from fastapi import FastAPI
from fastapi.testclient import TestClient
import httpx
import starlette
import fastapi

print(f"httpx version: {httpx.__version__}")
print(f"starlette version: {starlette.__version__}")
print(f"fastapi version: {fastapi.__version__}")

app = FastAPI()
try:
    client = TestClient(app)
    print("TestClient instantiation successful")
except Exception as e:
    print(f"TestClient instantiation failed: {e}")

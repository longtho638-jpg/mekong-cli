
import sys

import jose.jws
import jose.jwt
from jose.constants import ALGORITHMS

print(f"Python version: {sys.version}")
try:
    import cryptography
    print(f"Cryptography version: {cryptography.__version__}")
except ImportError:
    print("Cryptography not installed")

try:
    import jose
    print(f"python-jose version: {jose.__version__}")
except ImportError:
    print("python-jose not installed")

key = "secret"
payload = {"sub": "1234567890", "name": "John Doe", "iat": 1516239022}

try:
    token = jose.jwt.encode(payload, key, algorithm="HS256")
    print(f"Token encoded successfully: {token}")
    decoded = jose.jwt.decode(token, key, algorithms=["HS256"])
    print(f"Token decoded successfully: {decoded}")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

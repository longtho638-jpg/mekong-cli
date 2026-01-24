# Two-Factor Authentication (2FA/TOTP) Service

## Overview

The `TwoFactorService` provides comprehensive Two-Factor Authentication functionality using TOTP (Time-based One-Time Password) as defined in RFC 6238. This service enables secure 2FA implementation with QR code generation, backup codes, and proper security practices.

## Features

✅ **TOTP Implementation**
- Generate cryptographically secure TOTP secrets
- RFC 6238 compliant TOTP verification
- Configurable time windows for clock skew tolerance

✅ **QR Code Generation**
- Generate provisioning URIs for authenticator apps
- Create base64-encoded QR code images
- Support for custom issuer names

✅ **Backup Codes**
- Generate secure backup codes for account recovery
- SHA-256 hashing for secure storage
- One-time use verification

✅ **Mock Mode**
- Fallback implementation when pyotp is unavailable
- Testing support without external dependencies

## Installation

The service requires the following dependencies (already added to `requirements.txt`):

```txt
pyotp>=2.9.0
qrcode>=7.4.0
```

Install with:
```bash
pip install -r requirements.txt
```

## Usage

### Basic Setup

```python
from backend.services.two_factor_service import TwoFactorService, get_two_factor_service

# Use singleton instance
service = get_two_factor_service()

# Or create custom instance
service = TwoFactorService(
    issuer_name="My App",
    backup_codes_count=10,
    totp_interval=30,
    totp_digits=6,
)
```

### Enable 2FA for a User

```python
# Complete 2FA setup for a user
result = service.enable_2fa_for_user("user@example.com")

# Result contains:
# - secret: TOTP secret (store encrypted in database)
# - qr_code_url: Data URL for QR code display
# - provisioning_uri: URI for manual entry
# - backup_codes: Plain backup codes (show to user ONCE)
# - backup_codes_hashed: Hashed codes for database storage

# Display QR code to user
print(f"Scan this QR code: {result['qr_code_url']}")

# Store in database
user.totp_secret = encrypt(result['secret'])  # Encrypt before storing!
user.backup_codes = result['backup_codes_hashed']
user.two_factor_enabled = True
```

### Verify TOTP Code

```python
# Get code from user (from authenticator app)
user_code = "123456"

# Verify against stored secret
is_valid = service.verify_totp(
    secret=user.totp_secret,
    code=user_code,
    valid_window=1  # Allow ±30 seconds for clock skew
)

if is_valid:
    # Grant access
    print("2FA verification successful")
else:
    # Reject login
    print("Invalid 2FA code")
```

### Generate and Verify Backup Codes

```python
# Generate backup codes
codes = service.generate_backup_codes(count=10)
hashes = [service.hash_backup_code(code) for code in codes]

# Store hashed codes in database
user.backup_codes = hashes

# Show plain codes to user ONCE (for them to save)
print("Save these backup codes:")
for code in codes:
    print(f"  {code}")

# Later: Verify a backup code
user_backup_code = "ABCD-EFGH"
is_valid, matched_hash = service.verify_backup_code(
    code=user_backup_code,
    stored_hashes=user.backup_codes
)

if is_valid:
    # Remove used code (one-time use!)
    user.backup_codes = [h for h in user.backup_codes if h != matched_hash]
    user.save()
    print("Backup code verified")
```

### Disable 2FA

```python
# Disable 2FA for a user
service.disable_2fa_for_user("user@example.com")

# In practice, also:
# 1. Verify user identity (password or backup code)
# 2. Delete TOTP secret from database
# 3. Delete backup codes from database
# 4. Update user's 2FA status
user.totp_secret = None
user.backup_codes = []
user.two_factor_enabled = False
```

## API Reference

### Class: `TwoFactorService`

#### Constructor

```python
TwoFactorService(
    issuer_name: Optional[str] = None,
    mock_mode: bool = False,
    backup_codes_count: int = 10,
    totp_interval: int = 30,
    totp_digits: int = 6,
)
```

**Parameters:**
- `issuer_name`: Service name shown in authenticator apps (default: "Agency OS")
- `mock_mode`: Use mock implementation without pyotp (default: auto-detect)
- `backup_codes_count`: Number of backup codes to generate (default: 10)
- `totp_interval`: TOTP time step in seconds (default: 30)
- `totp_digits`: Number of digits in TOTP code (default: 6)

#### Methods

##### `generate_secret() -> str`

Generate a new TOTP secret (base32-encoded random key).

**Returns:** 32-character base32-encoded secret

**Example:**
```python
secret = service.generate_secret()
# => "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP"
```

##### `get_provisioning_uri(secret: str, user_identifier: str, issuer_name: Optional[str] = None) -> str`

Generate provisioning URI for QR code generation.

**Parameters:**
- `secret`: TOTP secret key
- `user_identifier`: User's email or username
- `issuer_name`: Override issuer name (optional)

**Returns:** Provisioning URI (`otpauth://totp/...`)

**Example:**
```python
uri = service.get_provisioning_uri(
    "JBSWY3DPEHPK3PXP",
    "user@example.com"
)
# => "otpauth://totp/Agency%20OS:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Agency%20OS"
```

##### `get_qr_code_url(secret: str, user_identifier: str, issuer_name: Optional[str] = None) -> str`

Generate QR code as a data URL for TOTP setup.

**Parameters:**
- `secret`: TOTP secret key
- `user_identifier`: User's email or username
- `issuer_name`: Override issuer name (optional)

**Returns:** Data URL for QR code image (`data:image/png;base64,...`)

**Example:**
```python
qr_url = service.get_qr_code_url("JBSWY3DPEHPK3PXP", "user@example.com")
# Use in HTML: <img src="{{ qr_url }}" alt="2FA QR Code">
```

##### `verify_totp(secret: str, code: str, valid_window: int = 1) -> bool`

Verify a TOTP code against the secret.

**Parameters:**
- `secret`: TOTP secret key
- `code`: 6-digit code from authenticator app
- `valid_window`: Time window tolerance (default: 1 = ±30 seconds)

**Returns:** `True` if code is valid, `False` otherwise

**Example:**
```python
is_valid = service.verify_totp("JBSWY3DPEHPK3PXP", "123456")
```

##### `generate_backup_codes(count: Optional[int] = None) -> List[str]`

Generate backup codes for account recovery.

**Parameters:**
- `count`: Number of codes to generate (default: from constructor)

**Returns:** List of backup codes in format `XXXX-XXXX`

**Example:**
```python
codes = service.generate_backup_codes(count=10)
# => ["ABCD-EFGH", "IJKL-MNOP", ...]
```

##### `hash_backup_code(code: str) -> str`

Hash a backup code for secure storage.

**Parameters:**
- `code`: Plain backup code (e.g., "ABCD-EFGH")

**Returns:** SHA-256 hash (64-character hex string)

**Example:**
```python
hashed = service.hash_backup_code("ABCD-EFGH")
# => "5d41402abc4b2a76b9719d911017c592..."
```

##### `verify_backup_code(code: str, stored_hashes: List[str]) -> Tuple[bool, Optional[str]]`

Verify a backup code against stored hashes.

**Parameters:**
- `code`: Plain backup code from user
- `stored_hashes`: List of hashed backup codes from database

**Returns:** Tuple of `(is_valid, matching_hash)`
- `is_valid`: `True` if code matches any stored hash
- `matching_hash`: The hash that matched (for one-time use marking)

**Example:**
```python
is_valid, matched_hash = service.verify_backup_code("ABCD-EFGH", stored_hashes)
if is_valid:
    # Remove used code from database
    remaining = [h for h in stored_hashes if h != matched_hash]
```

##### `enable_2fa_for_user(user_id: str, secret: Optional[str] = None) -> Dict[str, Any]`

Enable 2FA for a user (helper method for complete setup flow).

**Parameters:**
- `user_id`: User identifier (email or username)
- `secret`: Optional pre-generated secret

**Returns:** Dictionary with:
- `secret`: TOTP secret key
- `qr_code_url`: Data URL for QR code
- `provisioning_uri`: URI for manual entry
- `backup_codes`: List of plain backup codes (show once!)
- `backup_codes_hashed`: List of hashed codes (store in DB)

**Example:**
```python
result = service.enable_2fa_for_user("user@example.com")
print(f"Secret: {result['secret']}")
print(f"QR Code: {result['qr_code_url']}")
print(f"Backup Codes: {result['backup_codes']}")
```

##### `disable_2fa_for_user(user_id: str) -> bool`

Disable 2FA for a user (helper method).

**Parameters:**
- `user_id`: User identifier

**Returns:** `True` if disabled successfully

**Example:**
```python
success = service.disable_2fa_for_user("user@example.com")
```

### Function: `get_two_factor_service() -> TwoFactorService`

Get or create the singleton `TwoFactorService` instance.

**Returns:** Service instance

**Example:**
```python
service = get_two_factor_service()
```

## Security Best Practices

### 1. **Secret Storage**

Always encrypt TOTP secrets before storing in database:

```python
# ❌ WRONG: Plain text storage
user.totp_secret = result['secret']

# ✅ CORRECT: Encrypted storage
user.totp_secret = encrypt(result['secret'])  # Use your encryption method
```

### 2. **Backup Codes**

Store backup codes hashed, never plain text:

```python
# ❌ WRONG: Plain text storage
user.backup_codes = result['backup_codes']

# ✅ CORRECT: Hashed storage
user.backup_codes = result['backup_codes_hashed']
```

### 3. **One-Time Use**

Mark backup codes as used after verification:

```python
is_valid, matched_hash = service.verify_backup_code(code, user.backup_codes)
if is_valid:
    # Remove used code
    user.backup_codes = [h for h in user.backup_codes if h != matched_hash]
    user.save()
```

### 4. **Clock Skew Tolerance**

Use `valid_window` to handle clock differences:

```python
# Allow ±30 seconds (1 window before and after)
is_valid = service.verify_totp(secret, code, valid_window=1)

# More lenient: ±60 seconds (useful for mobile devices)
is_valid = service.verify_totp(secret, code, valid_window=2)
```

### 5. **Rate Limiting**

Implement rate limiting for 2FA verification to prevent brute force:

```python
# Limit to 5 attempts per 5 minutes
if user.totp_attempts > 5:
    if (datetime.now() - user.last_totp_attempt).seconds < 300:
        raise TooManyAttemptsError()
    user.totp_attempts = 0

# Verify code
is_valid = service.verify_totp(secret, code)
user.totp_attempts += 1
user.last_totp_attempt = datetime.now()
```

## Testing

Run the comprehensive test suite:

```bash
pytest backend/tests/test_two_factor_service.py -v
```

### Test Coverage

The test suite includes:
- ✅ Service initialization with custom parameters
- ✅ Secret generation and uniqueness
- ✅ Provisioning URI generation
- ✅ QR code URL generation
- ✅ TOTP verification (mock and real modes)
- ✅ Invalid code format handling
- ✅ Backup codes generation and uniqueness
- ✅ Backup code hashing (consistency, case-insensitivity)
- ✅ Backup code verification and one-time use
- ✅ Complete 2FA setup flow
- ✅ Enable/disable workflows

### Mock Mode Testing

For CI/CD environments without pyotp:

```python
service = TwoFactorService(mock_mode=True)

# Mock mode accepts "123456" for testing
assert service.verify_totp(secret, "123456") is True
```

## Integration Example

### FastAPI Endpoint Example

```python
from fastapi import APIRouter, Depends, HTTPException
from backend.services import get_two_factor_service

router = APIRouter()

@router.post("/users/2fa/enable")
async def enable_2fa(
    user_id: str,
    service: TwoFactorService = Depends(get_two_factor_service)
):
    """Enable 2FA for a user"""
    result = service.enable_2fa_for_user(user_id)

    # Store in database (implementation depends on your DB)
    await store_2fa_data(user_id, result)

    return {
        "qr_code": result['qr_code_url'],
        "backup_codes": result['backup_codes'],  # Show once!
    }

@router.post("/users/2fa/verify")
async def verify_2fa(
    user_id: str,
    code: str,
    service: TwoFactorService = Depends(get_two_factor_service)
):
    """Verify 2FA code"""
    user = await get_user(user_id)

    is_valid = service.verify_totp(
        secret=decrypt(user.totp_secret),
        code=code
    )

    if not is_valid:
        raise HTTPException(status_code=401, detail="Invalid 2FA code")

    return {"status": "verified"}
```

## Troubleshooting

### pyotp Not Available

If `pyotp` is not installed, the service automatically falls back to mock mode:

```python
# Check if running in mock mode
if service.mock_mode:
    logger.warning("Running in mock mode - pyotp not available")
```

Install pyotp:
```bash
pip install pyotp qrcode
```

### Clock Skew Issues

If users report valid codes being rejected:

1. Increase `valid_window`:
   ```python
   service.verify_totp(secret, code, valid_window=2)  # ±60 seconds
   ```

2. Check server time synchronization (NTP)

3. Verify authenticator app time is correct

### QR Code Not Displaying

If QR code data URL is too large for HTML:

```python
# Alternative: Save QR code to file
import qrcode

uri = service.get_provisioning_uri(secret, user_id)
qr = qrcode.make(uri)
qr.save("qr_code.png")
```

## License

Part of Agency OS - Binh Pháp Venture Studio

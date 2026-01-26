# Security & Signature Verification

To ensure that webhook requests originate from the Webhook Manager Kit and not a malicious actor, every request includes a signature in the headers.

## Headers

- `X-Webhook-Signature`: The HMAC SHA256 signature.
- `X-Webhook-Timestamp`: The timestamp of the request.
- `X-Webhook-Event`: The event type.

## Verification Process

1. **Extract the timestamp** from `X-Webhook-Timestamp` header.
2. **Prevent Replay Attacks**: Check if the timestamp is within a reasonable window (e.g., 5 minutes).
3. **Construct the signed payload string**:
   ```
   {timestamp}.{json_body}
   ```
   *Note: `json_body` must be the exact raw string body of the request.*
4. **Calculate the expected signature**:
   Compute an HMAC with SHA256 using your endpoint's `secret` as the key and the constructed string as the message.
5. **Compare**:
   The `X-Webhook-Signature` header format is `t={timestamp},v1={signature}`.
   Compare your calculated signature with the `v1` part of the header.

## Python Example

```python
import hmac
import hashlib
import json

def verify_signature(secret: str, body: str, headers: dict) -> bool:
    timestamp = headers.get("X-Webhook-Timestamp")
    header_signature = headers.get("X-Webhook-Signature")

    # Parse header signature (t=...,v1=...)
    # In this kit we send just the full string, but let's assume standard format
    # Our implementation sends: t={timestamp},v1={hex_digest}

    parts = dict(x.split('=') for x in header_signature.split(','))
    v1_signature = parts.get('v1')

    payload_to_sign = f"{timestamp}.{body}"

    expected_signature = hmac.new(
        key=secret.encode(),
        msg=payload_to_sign.encode(),
        digestmod=hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(v1_signature, expected_signature)
```

## Node.js Example

```javascript
const crypto = require('crypto');

function verifySignature(secret, body, headers) {
    const timestamp = headers['x-webhook-timestamp'];
    const signatureHeader = headers['x-webhook-signature'];

    // Parse t=...,v1=...
    const parts = signatureHeader.split(',').reduce((acc, part) => {
        const [key, value] = part.split('=');
        acc[key] = value;
        return acc;
    }, {});

    const payloadToSign = `${timestamp}.${body}`; // body should be raw string

    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payloadToSign)
        .digest('hex');

    return crypto.timingSafeEqual(
        Buffer.from(parts.v1),
        Buffer.from(expectedSignature)
    );
}
```

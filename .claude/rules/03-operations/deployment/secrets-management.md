# Secrets Management Standards

Guidelines for handling sensitive configuration and credentials.

## Rules
- Never store secrets (passwords, API keys, certificates) in version control.
- Use a dedicated secret management service (e.g., AWS Secrets Manager, HashiCorp Vault, Doppler).
- Inject secrets into the application environment at runtime using secure methods.
- Implement secret rotation policies for all sensitive credentials.
- Audit access to secrets and limit permissions based on the principle of least privilege.
- Use environment-specific secrets (dev secrets for dev, prod secrets for prod).
- Encrypt secrets at rest and in transit.

# Decentralized Identity — Skill

> Build self-sovereign identity systems using DIDs, verifiable credentials, ZK proofs, and eIDAS 2.0-compliant wallets.

## When to Activate
- Implementing W3C DID or Verifiable Credentials issuance/verification flows
- Building digital identity wallets or credential holder apps
- Integrating zero-knowledge proofs for privacy-preserving identity verification
- Designing systems that must comply with eIDAS 2.0, GDPR, or SOC 2 identity requirements

## Core Capabilities
| Area | Description |
|------|-------------|
| DID Management | Create, resolve, update, deactivate DIDs across method registries |
| VC Issuance | Issue signed credentials (JWT-VC, JSON-LD) with status lists |
| VC Verification | Verify credential signatures, revocation status, and schema conformance |
| ZK Proofs | Selective disclosure, age-over proofs, range proofs without exposing raw data |
| Wallet Integration | Connect to identity wallets via OID4VCI / OID4VP protocols |
| Compliance Engine | Map credential schemas to eIDAS 2.0 PID, AML, and KYC requirements |

## Architecture Patterns
- **Issuer-Holder-Verifier Triangle**: issuer signs VC → holder stores in wallet → verifier checks signature + revocation, never issuer-to-verifier direct coupling
- **DID Method per Trust Domain**: use `did:web` for enterprise, `did:key` for ephemeral, `did:ion`/`did:ebsi` for public registries
- **Status List 2021**: bitstring revocation list served from CDN — scalable, privacy-preserving revocation without per-credential lookup
- **OID4VCI + OID4VP**: use OpenID for VC issuance and presentation as transport layer over HTTPS — avoids bespoke protocols

## Key Technologies
- Libraries: `@sphereon/ssi-sdk`, `did-jwt-vc`, `veramo`, `aries-framework-javascript`
- ZK: `snarkjs`, `circom`, `bellman` (Rust), `semaphore` for group membership
- DID Resolvers: `did-resolver` + method-specific drivers (`did-web`, `did-key`, `did-ion`)
- Registries: EBSI (EU), ION (Bitcoin-anchored), Polygon ID
- Wallet protocols: OID4VCI draft 13, OID4VP draft 20, SIOPv2

## Implementation Checklist
- [ ] Define DID method and trust registry for issuer DID anchoring
- [ ] Design credential schema (JSON Schema + JSON-LD context), register on schema registry
- [ ] Implement issuance endpoint: authenticate subject → build VC → sign with issuer key (Ed25519 / P-256)
- [ ] Publish Status List 2021 endpoint for revocation
- [ ] Implement OID4VP presentation request and response verification
- [ ] Add selective disclosure (SD-JWT or ZK) for sensitive fields (DOB, SSN)
- [ ] Map credential claims to eIDAS 2.0 PID attribute set if EU compliance required
- [ ] Penetration test: replay attacks, credential forgery, revocation bypass

## Best Practices
- Never store PII in the DID document — only verification methods and service endpoints
- Use short-lived access tokens alongside long-lived VCs to limit blast radius on credential theft
- Pin cryptographic suite to Ed25519 or P-256 — avoid RSA for new systems
- Always verify `credentialStatus` at presentation time, not just signature
- Log verification events with minimal metadata (no credential content) for audit

## Anti-Patterns
- Storing raw VC payload in a central database — defeats self-sovereignty; store only credential metadata
- Using `did:ethr` on mainnet for high-frequency operations — gas costs and latency are prohibitive
- Treating credential schema as immutable — version schemas explicitly, maintain backward-compat resolvers
- Skipping ZK for sensitive attributes — presenting full DOB when only age-over-18 is needed is a privacy violation
- Building bespoke wallet protocols instead of OID4VCI/OID4VP — fragmentation kills interoperability

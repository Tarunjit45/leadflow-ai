# Security, Tenant Isolation & Guardrails

Security and data confidentiality are fundamental to the LeadFlow AI architecture.

---

## 1. Multi-Tenant Isolation
- Every database entity (`conversations`, `leads`, `appointments`, `messages`, `integrations`, `business_knowledge`) contains a foreign key relation to `business_id`.
- Tenant identity is derived directly from cryptographically validated JWT tokens on the backend (`get_current_business` dependency). Tenant IDs passed from client bodies are never trusted blindly.

---

## 2. Anti-Prompt-Injection & Input Sanitization
Customer inputs are treated strictly as untrusted data:
- **Injection Detection**: Input strings are scanned against adversarial jailbreak patterns (`ignore previous instructions`, `reveal system prompt`, `developer mode override`).
- **Context Pinning**: Prompts are structurally isolated to prevent prompt leakage.
- **Output Redaction**: Model responses pass through an automated redaction filter (`filter_output_for_secrets`) ensuring API keys, secrets, or internal system configurations are never transmitted to customers.

---

## 3. Credential Encryption at Rest
Third-party access tokens (Google OAuth tokens, Meta tokens) are encrypted at rest in PostgreSQL using AES-256 / Fernet symmetric encryption with key rotation support (`ENCRYPTION_KEY`).

---

## 4. Webhook Idempotency & Signature Verification
- Meta WhatsApp webhooks verify `X-Hub-Signature-256` HMAC-SHA256 digests.
- Stripe webhooks verify `Stripe-Signature` timestamps and secrets.
- Inbound events are deduplicated via an in-memory/Redis TTL cache to prevent duplicate booking or double-billing executions.

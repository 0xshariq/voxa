# Security Notes & Best Practices

## SSRF Protection
- Voxa blocks requests and redirects to private IPs (e.g., 127.0.0.1, 10.0.0.0/8, 192.168.0.0/16, etc.) by default.
- All URLs are validated before requests are made. Invalid or malformed URLs are blocked.
- If a redirect occurs, Voxa checks the final URL and blocks if it resolves to a private IP.

## Header Whitelisting/Blacklisting
- Only safe headers are allowed by default (e.g., Accept, Content-Type, Authorization, X-API-Key, etc.).
- Custom headers can be allowed by extending the SAFE_HEADERS list in `security.ts`.
- Sensitive headers (e.g., Cookie, Set-Cookie) are always blocked.

## Sensitive Data Redaction
- Voxa will redact tokens, passwords, and PII from logs, even in debug mode (see Logging Policy).

## HTTPS Required
- HTTPS is required in production. Voxa will warn if an insecure protocol is used.

## Extending Security
- You can extend SSRF protection and header filtering by providing your own validation logic or updating the `security.ts` utility.

---

For more details, see the [README.md](./README.md#security) and [Advanced Features](./docs/ADVANCED.md#security).

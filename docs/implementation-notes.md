# Implementation Notes

## Figma

The public Figma link exposes oEmbed and thumbnail data without an API token. The implementation follows the visible thumbnail composition: minimalist white landing, compact header, centered title, food image block, cards, contact form, and mobile state.

## SalesDrive

The public SalesDrive Swagger confirms:

- Base URL pattern: `https://{account}.salesdrive.me`
- Authorization header: `X-Api-Key`
- Lead creation endpoint: `POST /handler/`

The adapter keeps account-specific fields configurable through `.env`.

## Dilovod

Dilovod API uses `POST https://api.dilovod.ua` with a `packet` payload. The integration uses `saveObject` to create/update a `catalogs.persons` record with category metadata for a client.

## Anti-spam

The form avoids captcha by combining:

- HMAC signed token issued by the backend.
- Minimum and maximum form lifetime.
- Honeypot field.
- In-memory IP rate limit.

For multi-instance production deployment, replace the in-memory rate-limit map with Redis or another shared store.


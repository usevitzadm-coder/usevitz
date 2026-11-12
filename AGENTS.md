# Project rules

- Keep Xevek lookup validation, phone matching and response allowlists in its function-local module with rule tests; the handler must only SELECT orders and items and never expose unrelated customer or payment data.
- Xevek consent routes use a separate consent store and a strict response allowlist; only consent opt-out may write, never order lookups, to isolate marketing changes from sales data.
- Keep WhatsApp normalization and mutation rules in the shared function module consumed by the web consent function and Xevek; preserve real E.164 digits and use ninth-digit aliases only for Brazilian matching.
- Browser consent writes go through marketing-consent; account preferences require a confirmed session, include consents linked to its verified email, and reject conflicting consent owners even for phones in editable metadata or own orders.
- Use one service-only transaction to save public GymRats/newsletter submissions together with explicit consent; unchecked submissions must not grant or overwrite consent.

- Keep GymRats competition dates, prize allocations and discount conditions in the shared competition data module, consumed by both competition pages and covered by rule tests, so the signup and confirmation pages remain consistent.
- Use libphonenumber-js in the shared GymRats phone utility for country options, national formatting and E.164 serialization, so dialing rules and saved contact numbers stay consistent across countries.
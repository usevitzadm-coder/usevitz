# Project rules

- Keep GymRats competition dates, prize allocations and discount conditions in the shared competition data module, consumed by both competition pages and covered by rule tests, so the signup and confirmation pages remain consistent.
- Use libphonenumber-js in the shared GymRats phone utility for country options, national formatting and E.164 serialization, so dialing rules and saved contact numbers stay consistent across countries.


# "More Coffee, Please" — Promotional Landing Page

## Overview

Create a new promotional page at `/more-coffee-please` that replicates the concept from the old Wix site with the Vitz design system. The page promotes the "Coffee" color collection — any purchase containing a Coffee-colored piece includes a free drip coffee from Fera Café.

## What will be built

### 1. New page: `src/pages/MoreCoffeePleasePage.tsx`

A standalone landing page with the Vitz Layout (Header + Footer), containing:

- **Hero section** with warm coffee-toned background (`bg-[#f5ead6]` or similar earthy tone matching the old page's beige/brown aesthetic)
- **Title**: "More Coffee, please!" in elegant italic serif (Cormorant Garamond)
- **Model image** in a circular frame (will need an asset — can use a placeholder or an existing product image initially)
- **Description text** explaining the promo: coffee-colored pieces come with a free drip coffee from Fera Café
- **"Como funciona?"** section with 3 numbered steps
- **CTA button** "Ver peças" linking to `/produtos?cor=Coffee` (filtered products page)

### 2. Route registration in `App.tsx`

Add lazy-loaded route:
```
/more-coffee-please → MoreCoffeePleasePage
```

### 3. Design approach

- Warm earthy color palette (browns, beiges, golds) — aligned with the old page's `#f5ead6` background and coffee tones
- Uses existing Vitz design tokens and components (Button, Layout)
- Responsive layout: image + text side-by-side on desktop, stacked on mobile
- The CTA "Ver peças" will link to the products page filtered by the Coffee color

### 4. Assets needed

- A hero/model image for the page. For now, we can use an existing product image or a placeholder. You can later replace it with the actual promotional photo.

## Files to create/modify

| File | Action |
|------|--------|
| `src/pages/MoreCoffeePleasePage.tsx` | Create |
| `src/App.tsx` | Add route |


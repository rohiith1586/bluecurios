# BlueCurious

Premium, mobile-first crochet e-commerce starter built with React + Vite, Supabase-ready authentication/data/RLS, and a Razorpay-ready checkout boundary.

## Run

```bash
npm install
cp .env.example .env
npm run dev
```

## Supabase

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Create storage buckets for product images and private custom-order references.
5. Create your first user, then set that user's `profiles.role` to `admin` in a controlled admin workflow.

## Catalogue

No invented products, prices, reviews, social accounts, or company details are included. The shop starts empty by design. Add real products through the admin workflow.

## Razorpay

Do not put the Razorpay secret in the browser. The checkout page intentionally stops at a "Continue to Razorpay" boundary. Implement:

- server/Edge Function creates Razorpay order
- server returns order id
- browser opens Razorpay Checkout using the public key
- server verifies Razorpay signature
- server writes paid order + order items to Supabase
- webhook handles asynchronous payment/order events

## Production hardening

Before launch, add:
- real product photography and alt text
- verified policies, contact details, GST/business details where applicable
- server-side authorization for every admin mutation
- storage policies
- rate limiting / bot protection for forms
- server-side price and inventory validation
- Razorpay signature verification + webhooks
- transactional inventory reservation
- real transactional email
- structured product JSON-LD generated from live product data
- sitemap/robots and canonical URLs
- analytics with a privacy-conscious consent flow

## Architecture

`src/components` — reusable UI
`src/pages` — route-level screens
`src/lib/store.js` — temporary client cart/wishlist state
`src/lib/supabase.js` — Supabase client
`supabase/schema.sql` — relational schema + RLS

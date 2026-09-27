[README.md](https://github.com/user-attachments/files/32696007/README.md)
# Troy Premier Green Cleaning Co. — Booking Platform

Production-oriented booking and operations platform for Troy Premier Green Cleaning Co.
(ABRI PRO CLEANING SERVICES LLC), Troy, MI. React + Supabase + Stripe + Twilio, deployed
on Netlify.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router |
| Database / Auth / Storage | Supabase (Postgres, Row Level Security, Auth, Storage) |
| Payments | Stripe Checkout |
| SMS | Twilio |
| Email | Resend (swap for any provider — see `netlify/functions/send-email.ts`) |
| Calendar | Google Calendar REST API |
| Hosting | Netlify (static frontend + Netlify Functions for anything needing secret keys) |

## Project layout

```
src/
  components/
    booking/        8-step booking wizard + BookingContext (pricing, scheduling, submission)
    admin/           Admin dashboard: metrics, calendar, bookings, pricing editor, etc.
    cleaner/         (cleaner dashboard lives in pages/CleanerDashboardPage.tsx)
    marketing/       Hero, services grid, trust indicators, FAQ, before/after, testimonials
    seo/             SEO head manager + schema.org JSON-LD builders
    layout/          Header, footer, sticky mobile Book Now bar
    ui/              Button, Input/Select/Textarea, Card primitives
  lib/
    pricingEngine.ts   All pricing math — reads pricing_rules from the DB, nothing hard-coded
    supabaseClient.ts  Public (anon-key) Supabase client
    analytics.ts       GA4 / Meta Pixel integration points + track() helper
  pages/             One file per route (see src/App.tsx for the route table)
  data/seoContent.ts Static SEO copy per service (used for the /services/:slug pages)
  types/database.ts  TypeScript types mirroring the Postgres schema

netlify/functions/  Server-only code (Stripe, Twilio, email, Google Calendar) — the ONLY
                     place the Stripe secret key, Twilio auth token, and Supabase
                     service_role key are ever used.

supabase/
  migrations/0001_init_schema.sql   Every table in the spec, enums, indexes, the
                                     double-booking-prevention unique index
  migrations/0002_rls_policies.sql  Row Level Security for every table, per role
  seed/seed.sql                     Services, add-ons, pricing rules, checklists,
                                     SMS/email templates — all admin-editable afterward
```

## What's fully built

- Complete relational schema for every entity in the spec, with RLS per role
  (owner/admin/cleaner/property_manager/customer) and a unique index that makes literal
  double-booking a database-level impossibility, not just a UI nicety.
- A genuinely configurable pricing engine (`src/lib/pricingEngine.ts`) — every dollar
  figure comes from the `pricing_rules` table, edited from Admin → Pricing. No prices are
  hard-coded in application code.
- The full 8-step customer booking wizard: service → property/commercial details →
  add-ons → live price → real-availability scheduling → contact info → summary → payment
  (full / deposit / pay-later), wired to Stripe Checkout via a Netlify Function.
- SEO landing pages for all 10 requested service/location combinations, with
  LocalBusiness, Service, and FAQPage schema.org markup.
- Commercial lead form and a separate property-manager request workflow, matching the
  spec's requirement that these NOT go through the consumer booking wizard and NOT be
  auto-quoted.
- Cleaner dashboard: today's/upcoming jobs, start/pause/complete (complete is blocked
  until every checklist item is checked), before/after photo upload to Supabase Storage,
  issue reporting, contact-office shortcut.
- Admin dashboard: live metrics, a day/week/month calendar, a bookings table with status
  management, an editable pricing table, services/customers/cleaners lists, payments log,
  editable SMS/email templates, review moderation, a basic revenue-by-service report, and
  site settings (tax rate, deposit %, booking lead time, guarantee messaging toggle).
- Netlify Functions for: Stripe Checkout session creation + webhook (idempotent —
  confirms payment, writes to `payments`, flips booking status, fires SMS/email), Twilio
  SMS send, Resend email send, Google Calendar event creation (now actually wired to fire
  after both the Stripe webhook and the pay-later confirmation, whenever
  `GOOGLE_CALENDAR_REFRESH_TOKEN` is configured), a scheduled 24-hour-reminder job, an
  idempotent pay-later confirmation endpoint, and an account-linking endpoint that
  connects a guest booking to a customer's portal account on first sign-in.
- **Customer portal**: magic-link sign-in that auto-links any guest bookings made with
  that email, a live bookings list with reschedule (checked against real availability,
  excluding the booking's own old slot) and cancel actions, an invoices view, editable
  saved properties (address/access instructions), and one-click rebooking.

## What's intentionally left as extension points

This is a large system; the following are scaffolded (schema + RLS + UI hooks exist) but
would benefit from another pass before a real launch:

- **hCaptcha/reCAPTCHA** — the commercial and property-manager forms now have honeypot
  spam protection (a visually hidden field bots tend to fill; a real submission with it
  filled in is silently dropped). `VITE_HCAPTCHA_SITE_KEY` / `HCAPTCHA_SECRET_KEY` are
  still wired into `.env.example` if you want a stronger, challenge-based layer for
  high-value forms before go-live — the honeypot alone stops unsophisticated bots, not a
  targeted attack.
- **Rate limiting** on public POST endpoints — `create-checkout-session` now refuses to
  double-charge an already-paid booking, and the internal notification functions are no
  longer publicly callable (see Security notes), but there's still no IP-based throttle
  on, e.g., repeated `commercial_leads` inserts. Add a lightweight limiter (Upstash Redis
  or similar) in front of the public-insert forms before launch if spam becomes an issue.
- **Cleaner utilization** and other availability-derived metrics need real data in the
  `availability` table before they're meaningful; the dashboard notes this inline.
- Professional photography is not included — `Hero.tsx` and `BeforeAfterGallery.tsx`
  have clearly marked placeholders.
- The property-manager and cleaner portals authenticate but don't yet have a dedicated
  "portal home" the way the customer portal does — `link-customer-account.ts` already
  links a property manager's `user_id` on sign-in, so a PM-facing view of their
  `property_manager_requests` is mostly a matter of adding the page.

## Local development

```bash
npm install
cp .env.example .env   # fill in your Supabase/Stripe/Twilio/Resend/Google values
npm run dev
```

The frontend runs against Supabase directly using the public anon key (safe — RLS
enforces access). To exercise the Netlify Functions locally, install the Netlify CLI and
run `netlify dev` instead of `vite dev` — it proxies both the Vite dev server and the
functions on one port.

## Database setup

1. Create a Supabase project.
2. Run the migrations in order (SQL editor, or `supabase db push` with the Supabase CLI):
   - `supabase/migrations/0001_init_schema.sql`
   - `supabase/migrations/0002_rls_policies.sql`
3. Run `supabase/seed/seed.sql` to load services, add-ons, pricing, checklists, and
   message templates.
4. Create a Storage bucket named `job-photos` (used by the cleaner dashboard's
   before/after photo upload) — Storage → New bucket → set it private, and add a policy
   allowing authenticated cleaners/staff to insert/read, mirroring the RLS pattern in
   `0002_rls_policies.sql`.
5. Create your first owner account: sign up a user via Supabase Auth, then insert a
   matching row into `public.users` with `role = 'owner'`.

See `docs/DEPLOYMENT.md` for the full Netlify deployment walkthrough, and
`docs/STRIPE_SETUP.md`, `docs/TWILIO_SETUP.md`, `docs/GOOGLE_CALENDAR_SETUP.md` for each
integration.

## Security notes

- The frontend (`src/lib/supabaseClient.ts`) only ever holds the Supabase **anon** key.
  All privileged operations (payment confirmation, SMS/email sending, Google Calendar
  writes) happen in `netlify/functions/*`, which use the **service_role** key — that key,
  the Stripe secret key, and the Twilio auth token are never present in any file under
  `src/`.
- Every table has Row Level Security enabled; see `0002_rls_policies.sql` for the exact
  rule per role.
- Stripe webhook signature verification is enforced in `stripe-webhook.ts` — requests
  without a valid `Stripe-Signature` header are rejected.
- `send-sms`, `send-email`, and `google-calendar-sync` are Netlify Function URLs, which
  means they're reachable by anyone on the internet by default. They're gated behind an
  `x-internal-secret` header checked against `INTERNAL_FUNCTIONS_SECRET`, which only this
  project's own server-side functions (the Stripe webhook, the pay-later confirmation
  function, and the scheduled reminder job) know how to send — see
  `netlify/functions/_internalAuth.ts`.
- Payment-related functions are idempotent: `stripe-webhook.ts` skips re-processing a
  Stripe event it's already recorded (keyed on the payment intent ID), and
  `create-checkout-session.ts` refuses to open a second Checkout Session against a
  booking that's already marked paid.

## Manual QA checklist (run before every deploy)

- [ ] Booking flow: complete all 8 steps for one residential and one commercial service
- [ ] Payment flow: full payment, deposit, and pay-later, all in Stripe **test mode**
- [ ] Double-booking: attempt to book the same property/date/time twice — second attempt
      must fail (enforced by the unique index in `0001_init_schema.sql`)
- [ ] Availability logic: block out a cleaner via `availability.is_available = false` for
      a date and confirm that day's slots shrink or disappear
- [ ] Cleaner flow: sign in, start/pause/complete a job, confirm "complete" is blocked
      until the checklist is fully checked, upload a before and after photo
- [ ] Admin flow: change a pricing rule and confirm the booking wizard's price updates;
      change a booking's status; publish a review
- [ ] Auth/authorization: confirm a customer cannot see another customer's bookings, and
      a cleaner cannot see jobs they aren't assigned to (RLS should block both)
- [ ] Invalid input: submit the booking, commercial lead, and property-manager forms with
      missing required fields and confirm client-side validation blocks submission
- [ ] Mobile layout: run the full booking wizard on a narrow viewport; confirm the sticky
      Book Now/Call bar doesn't overlap form content
- [ ] SEO: view source on two `/services/:slug` pages and confirm unique title, meta
      description, and JSON-LD are present
- [ ] SMS/email: trigger `send-sms` and `send-email` against Twilio/Resend test or
      sandbox credentials and confirm a row lands in the `messages` table

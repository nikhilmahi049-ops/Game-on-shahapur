# GAME ON SHAHAPUR — Setup guide

This is a customer-facing React website starter with shared booking availability. It is **not live until you connect Supabase and deploy it**.

## 1. Create the booking database
1. Create a free project at https://supabase.com.
2. Open **SQL Editor**, paste all of `supabase/schema.sql`, and run it.
3. Open **Project Settings → API** or **Connect** and copy the Project URL and publishable/anon key.
4. Never put a `service_role` or secret key in the website. The supplied SQL grants public visitors read access only to console/date/time/duration/status columns; customer names and mobile numbers are not publicly readable.

## 2. Connect the site
Rename `.env.example` to `.env` and fill in:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Install Node.js LTS from https://nodejs.org. In this folder run:
```bash
npm install
npm run dev
```
Use the local URL shown by Vite to test. Try booking overlapping times from two devices before launch.

## 3. Publish free
Use https://netlify.com or https://pages.cloudflare.com. Put this folder in a GitHub repository, import it into your host, set build command to `npm run build` and output directory to `dist`. Add the two environment variables in hosting settings and deploy. After changing variables, redeploy.

## Current assumptions
- Opening hours: 10 AM–10 PM
- PS5: ₹120/hour
- PS4 Station 01 and 02: ₹80/hour
- Booking durations: 1–3 hours
- Customer mobile: Indian 10-digit number
- Owner views bookings through Supabase Dashboard → Table Editor → bookings; set `status` to `cancelled` to cancel.
- No admin dashboard, WhatsApp notification, payment collection, or customer cancellation link yet.
- Add your real shop contact/address before sharing the site. Check free-tier limits and privacy obligations before accepting real customer details.

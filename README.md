# Sleepr

Sleepr is a simple social sleep tracking app built with Next.js (App Router), Prisma, SQLite, and Tailwind CSS.

## Getting started
1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and adjust values (at minimum set `SESSION_SECRET`).
3. Run database migrations: `npx prisma migrate dev --name init`
4. Seed sample data: `npx prisma db seed`
5. Start dev server: `npm run dev`

Admin credentials from the seed:
- Email: `admin@sleepr.test`
- Password: `Admin123!`

## Features
- Email/password authentication with session cookie
- Feed of sleep sessions from you and people you follow
- Sleep creation, details, reactions, and comments
- CSV import with ImportJob tracking
- Profile with weekly chart and Garmin sync placeholder
- Groups with member management and shared feed
- Admin dashboard for users, sleep sessions, comments, reactions, groups, and imports

## Main routes
- `/login`, `/signup`
- `/feed`
- `/sleep/new`, `/sleep/[id]`, `/sleep/import`
- `/u/[id]` profile pages
- `/groups`, `/groups/[id]`
- `/admin` and subpages for admin management

## CSV import
Upload a CSV with columns like Date, Score, Resting Heart Rate, Quality, Duration, Bedtime, Wake Time at `/sleep/import`. The app stores an ImportJob summary for admins.

## Garmin placeholder
On your profile page use **Sync Garmin Sleep** to generate sample Garmin sessions. Replace the stub in `lib/garminService.ts` with real Garmin integration when ready.

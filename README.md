# Gym Tracker App

Modern, mobile-first workout tracker built with React + Tailwind + Express + MongoDB.

## Features

- Split selection before workout (`Push`, `Pull`, `Legs`, `Rest Day`, `Custom`) with muscle mapping
- Dynamic workout logger with multiple exercises and per-set reps/weight
- Auto total volume calculation (`sets x reps x weight`)
- Dashboard with recent workouts, PR summary, streak, and weekly metrics
- Progress charts (weekly volume + exercise strength progression)
- Weekly planner with 7-day split assignment and local cache
- Bonus UX: quick-add last workout, favorites, rest timer, next split suggestion

## Tech

- Frontend: React, Vite, Tailwind CSS, Framer Motion, Recharts
- Backend: Node.js, Express, Mongoose, MongoDB

## Run Locally

1. Install dependencies:
   - `npm install`
   - `npm install --prefix client`
   - `npm install --prefix server`
2. Configure server env:
   - `cp server/.env.example server/.env`
   - Set `MONGODB_URI`, `PORT`, and **`JWT_SECRET`** (required for auth)
   - Optional: `GOOGLE_CLIENT_ID` (Web client ID from Google Cloud) for Google sign-in
   - Set `CLIENT_ORIGIN` to your frontend URL (e.g. `http://localhost:5173`)
3. Frontend env:
   - `cp client/.env.example client/.env`
   - Set `VITE_API_URL` (e.g. `http://localhost:4000/api`)
   - Optional: `VITE_GOOGLE_CLIENT_ID` (same Google Web client ID as on the server)
4. Start both apps:
   - `npm run dev`
5. Open:
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:4000`
6. Register your first account on `/register`. All workout, planner, and dashboard data is scoped to that user.

### Auth (Phase 1)

- Email + password: minimum 8 characters, at least one uppercase letter and one symbol.
- Google: create an OAuth **Web client** in [Google Cloud Console](https://console.cloud.google.com/apis/credentials). Add **Authorized JavaScript origins** (your Vite dev URL and production URL) and use the same client ID in `GOOGLE_CLIENT_ID` (server) and `VITE_GOOGLE_CLIENT_ID` (client).
- If an account exists with your email and you sign in with Google, the Google account is **linked** to that user.

### Database note (existing dev data)

Workouts, planner rows, and user meta now require a `userId`. For a clean slate, drop old collections or use a fresh database after pulling this change.

## API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google` (body: `{ "credential": "<Google ID token>" }`)
- `GET /api/auth/me` (Bearer token)
- `GET /api/dashboard`
- `GET /api/dashboard/progress`
- `GET /api/workouts`
- `POST /api/workouts`
- `PUT /api/workouts/:id`
- `DELETE /api/workouts/:id`
- `GET /api/planner?weekStart=YYYY-MM-DD`
- `PUT /api/planner`
- `GET /api/exercises/favorites`
- `PUT /api/exercises/favorites`
- `GET /api/exercises/quick-add`

## Notes

- Data persistence is MongoDB-first.
- Planner and active workout draft also cache to `localStorage` for resilience.

## Deploy (Production)

1. Set production env vars:
   - Server (`server/.env` or host dashboard):
     - `NODE_ENV=production`
     - `PORT=4000` (or platform port)
     - `MONGODB_URI=<your mongodb connection string>`
     - `JWT_SECRET=<long random string>`
     - `CLIENT_ORIGIN=https://your-frontend-domain.com`
     - Optional: `GOOGLE_CLIENT_ID` (same Web client ID as the frontend)
   - Client (`client/.env`):
     - `VITE_API_URL=https://your-api-domain.com/api`
     - Optional: `VITE_GOOGLE_CLIENT_ID`
2. Build frontend:
   - `npm run build --prefix client`
3. Start backend:
   - `npm run start --prefix server`
4. Verify:
   - `GET /health` returns `{ ok: true }`
   - create/list workouts works from deployed frontend
   - CORS allows only your frontend origin

## Production Hardening Included

- Security headers via `helmet`
- API rate limiting via `express-rate-limit`
- Request payload size limit (`1mb`)
- CORS allowlist via `CLIENT_ORIGIN`
- Centralized error responses without stack leaks in production
- Server-side workout payload validation for split/exercises/sets

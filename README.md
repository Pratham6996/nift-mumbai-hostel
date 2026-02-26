# NIFT Mumbai Hostel Digital Platform

A production-ready hostel management system for NIFT Mumbai with weekly menu display, structured feedback, personal expense tracking, and an admin control panel.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Backend | FastAPI (Python) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Email OTP) |
| Storage | Supabase Storage |
| Deployment | Vercel (frontend) + Render (backend) |

## Project Structure

```
nift-mumbai/
├── backend/          # FastAPI server
│   ├── main.py
│   ├── auth_middleware.py
│   ├── scheduler.py
│   ├── models/       # Pydantic schemas
│   ├── routers/      # API endpoints
│   └── services/     # Business logic
├── frontend/         # Next.js app
│   ├── app/          # Pages (App Router)
│   ├── components/   # Reusable components
│   ├── context/      # Auth context
│   └── lib/          # Supabase & API clients
└── supabase/         # Migration SQL & setup docs
```

## Setup

### 1. Database
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run `supabase/migration.sql` in the SQL Editor
3. Follow `supabase/storage_setup.md` to create the storage bucket

### 2. Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # fill in your Supabase credentials
uvicorn main:app --reload
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env.local  # fill in your credentials
npm run dev
```

## Environment Variables

### Backend `.env`
- `SUPABASE_PROJECT_URL` — Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key (never expose to frontend)
- `SUPABASE_JWT_SECRET` — JWT secret from Supabase Settings → API
- `FRONTEND_URL` — Frontend URL for CORS

### Frontend `.env.local`
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public key
- `NEXT_PUBLIC_BACKEND_URL` — Backend API URL

## Features

- **OTP Authentication** — Passwordless email login via Supabase Auth
- **Weekly Menu** — Responsive grid with day tabs and meal cards
- **Feedback System** — Submit with images, upvote, filter by category, 24h edit window
- **Expense Tracker** — Monthly charts (Recharts), CSV export, category breakdown
- **Admin Panel** — Upload menus, moderate feedback, view user stats
- **Auto Cleanup** — Daily scheduled job deletes images older than 30 days
- **Role-based Access** — JWT validation + database role checks on every protected route

# NIFT Mumbai Hostel Platform — Full Technical Blueprint

---

## 1. Project Overview

### What the System Does

The NIFT Mumbai Hostel Platform is a digital hostel management system built for the National Institute of Fashion Technology (NIFT), Mumbai campus. It provides four core features:

1. **Weekly Menu Display** — Admin uploads the weekly hostel mess menu; students view it organized by day and meal.
2. **Feedback System** — Authenticated users submit feedback (with optional image attachments and anonymous posting) about food quality, quantity, hygiene, or general suggestions. Other users can upvote feedback (toggle-based, one vote per user per feedback item).
3. **Personal Expense Tracker** — Authenticated users log, view, chart, and export (CSV) their personal food/drink/snack spending by month.
4. **Admin Panel** — Admins upload menus, moderate feedback (view stats, delete), and list all users.

### High-Level Architecture

```
┌──────────────────┐       HTTPS        ┌──────────────────┐       TCP/HTTPS      ┌─────────────────────┐
│                  │  ──────────────────►│                  │  ────────────────────►│                     │
│  Next.js 14 App  │   REST JSON / Form │  FastAPI Backend │   supabase-py SDK    │  Supabase (Postgres │
│  (App Router)    │◄────────────────── │  (Python)        │◄──────────────────── │  + Auth + Storage)  │
│                  │                    │                  │                      │                     │
└──────────────────┘                    └──────────────────┘                      └─────────────────────┘
     │                                       │
     │ Supabase JS SDK                       │ JWKS fetch (httpx)
     │ (Auth only)                           │
     ▼                                       ▼
┌──────────────────┐                    ┌──────────────────┐
│ Supabase Auth    │                    │ Supabase Auth    │
│ (signup/login)   │                    │ JWKS endpoint    │
└──────────────────┘                    └──────────────────┘
```

- **Frontend (Next.js 14)** — Client-side rendered React app using the App Router. Communicates with the backend via REST. Uses the Supabase JS SDK **only** for authentication (signup, login, session management). Deployed to **Vercel**.
- **Backend (FastAPI)** — Python REST API. Uses the Supabase Python SDK with the **service role key** to perform all database operations (bypassing RLS). Validates JWTs from the frontend. Deployed to **Render** via Procfile.
- **Database (Supabase/PostgreSQL)** — Hosted PostgreSQL with Supabase extensions. Four custom tables (`users`, `weekly_menus`, `feedback`, `expenses`) plus one join table (`feedback_upvotes`). RLS is enabled on all tables.
- **Storage (Supabase Storage)** — Private bucket `feedback-images` for feedback image attachments. Signed URLs generated on-the-fly with 1-hour expiry.
- **Scheduler (APScheduler)** — Background cron job runs daily at 2:00 AM to delete images older than 30 days from Supabase Storage.

### Runtime Flow Summary

1. User opens the frontend (Next.js). The `AuthProvider` context checks Supabase Auth for an existing session.
2. If no session, the user can browse the menu (public) and feedback list (public read). Expenses and admin features require login.
3. On login/signup, the frontend calls Supabase Auth directly (`signInWithPassword` / `signUp`). Supabase returns a JWT.
4. The `AuthProvider` detects the session change, stores the JWT in memory (Supabase JS SDK manages it), and calls `POST /api/auth/register` then `GET /api/auth/me` on the backend to sync/fetch the user profile from the `users` table.
5. For all subsequent API calls, the frontend injects the `Authorization: Bearer <JWT>` header. The backend decodes and verifies the JWT (supporting both HS256 and ES256 algorithms) using `python-jose`.
6. The backend performs all DB operations via the Supabase Python SDK using the **service role key**, which bypasses RLS.

---

## 2. Repository Structure

### 2.1 Root Structure

```
nift-mumbai/
├── .gitignore          # Ignores .env, .env.local, __pycache__, venv, node_modules, .next
├── README.md           # Project overview, setup instructions, feature list
├── backend/            # FastAPI Python backend
├── frontend/           # Next.js 14 frontend
└── supabase/           # SQL migrations and storage setup docs
```

| File/Dir | Purpose |
|---|---|
| `.gitignore` | Excludes environment files, Python bytecode, virtual envs, node_modules, .next build, IDE configs, OS files |
| `README.md` | Developer-facing setup guide with tech stack table, project structure, environment variable docs, feature list |
| `backend/` | All Python backend code |
| `frontend/` | All Next.js frontend code |
| `supabase/` | Database migration SQL scripts and Supabase Storage setup documentation |

### 2.2 Frontend Structure (Next.js)

```
frontend/
├── .env.example            # Template for environment variables
├── .env.local              # Actual environment variables (gitignored)
├── .gitignore              # Frontend-specific gitignore
├── README.md               # Auto-generated Next.js readme
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout (server component)
│   ├── page.tsx            # Home page (client component)
│   ├── globals.css         # Global styles + Tailwind + custom utilities
│   ├── favicon.ico         # Site favicon
│   ├── admin/page.tsx      # Admin dashboard (client component)
│   ├── expenses/page.tsx   # Expense tracker (client component)
│   ├── feedback/page.tsx   # Feedback list + form (client component)
│   ├── login/page.tsx      # Login/register page (client component)
│   └── menu/page.tsx       # Weekly menu display (client component)
├── components/
│   └── Navbar.tsx          # Navigation bar (client component)
├── context/
│   └── AuthContext.tsx     # Auth state provider (client component)
├── lib/
│   ├── api.ts              # API communication layer (fetch wrappers)
│   └── supabase.ts         # Supabase JS client initialization
├── public/                 # Static assets (favicon + Next.js defaults)
├── eslint.config.mjs       # ESLint configuration
├── next-env.d.ts           # TypeScript env declarations
├── next.config.mjs         # Next.js configuration
├── package.json            # Dependencies and scripts
├── postcss.config.js       # PostCSS config for Tailwind
├── tailwind.config.ts      # Tailwind CSS configuration
└── tsconfig.json           # TypeScript configuration
```

**App Router vs Pages Router**: This project uses the **App Router** exclusively (the `app/` directory). There is no `pages/` directory.

**Server vs Client Components**: The root `layout.tsx` is the **only server component** (it exports `metadata`). Every page file and all components are marked `"use client"` and render entirely on the client side. There are **no server-side data fetching patterns** (no `getServerSideProps`, no server actions, no RSC data loading). All data fetching occurs client-side via `useEffect` + `fetch`.

**Layout Structure**: `app/layout.tsx` is the root layout. It wraps all pages with `<AuthProvider>` and renders `<Navbar />` followed by `<main className="pt-16 min-h-screen">{children}</main>`. Google Fonts (Inter) is loaded via a `<link>` tag in `<head>`.

**Middleware Usage**: There is **no Next.js middleware** (`middleware.ts` does not exist). Route protection is handled client-side in each page component by checking `useAuth()` and calling `router.push("/login")` or `router.push("/")`.

**API Routes**: There are **no Next.js API routes**. All API communication goes to the external FastAPI backend.

### 2.3 Backend Structure (FastAPI)

```
backend/
├── .env                    # Environment variables (gitignored)
├── .env.example            # Template
├── Procfile                # Render/Heroku deployment command
├── main.py                 # FastAPI app entry point
├── auth_middleware.py       # JWT verification + role-based auth
├── scheduler.py            # APScheduler cron job setup
├── requirements.txt        # Python dependencies
├── models/                 # Pydantic schemas
│   ├── __init__.py
│   ├── user.py             # UserRole, UserOut, UserCreate, TokenPayload
│   ├── feedback.py         # FeedbackCategory, FeedbackCreate, FeedbackUpdate, FeedbackOut
│   ├── expense.py          # ExpenseCategory, ExpenseCreate, ExpenseOut, MonthlySummary
│   └── menu.py             # MealItem, DayMenu, WeeklyMenuCreate, WeeklyMenuOut
├── routers/                # API route handlers
│   ├── __init__.py
│   ├── auth.py             # /api/auth/* endpoints
│   ├── admin.py            # /api/admin/* endpoints
│   ├── feedback.py         # /api/feedback* and /api/admin/feedback* endpoints
│   ├── expenses.py         # /api/expenses* endpoints
│   └── menu.py             # /api/menu* and /api/admin/menu endpoints
├── services/               # Business logic layer
│   ├── __init__.py
│   ├── supabase_client.py  # Supabase Python client initialization
│   ├── feedback_service.py # Feedback CRUD + upvote logic
│   ├── expense_service.py  # Expense CRUD + monthly summary
│   ├── menu_service.py     # Menu CRUD (create/update with upsert)
│   ├── storage_service.py  # Supabase Storage upload/download/delete
│   └── cleanup_service.py  # Scheduled image cleanup
└── venv/                   # Python virtual environment (gitignored)
```

**Main App Entry Point**: `main.py` creates the FastAPI application with title "NIFT Mumbai Hostel Platform", version "1.0.0". It configures CORS middleware, rate limiting (slowapi), and includes all five routers. The `lifespan` async context manager starts/stops the APScheduler.

**Dependency Injection**: FastAPI's `Depends()` is used for authentication. Two dependency functions exist in `auth_middleware.py`:
- `get_current_user` — Extracts and validates the JWT from the `Authorization: Bearer` header. Returns a `TokenPayload`.
- `require_admin` — Depends on `get_current_user`, then queries the `users` table to verify `role == "admin"`.

**Services Layer**: All database operations are encapsulated in service modules. Routers call service functions; services call the Supabase client. The Supabase client is a **module-level singleton** initialized at import time in `supabase_client.py`.

---

## 3. Backend API Specification

### Root Endpoints

#### `GET /`
- **Purpose**: Health check
- **Auth**: No
- **Response**: `{"status": "ok", "service": "NIFT Mumbai Hostel Platform API"}`
- **Status codes**: 200

#### `GET /api/health`
- **Purpose**: API health check
- **Auth**: No
- **Response**: `{"status": "ok"}`
- **Status codes**: 200

---

### Auth Router (`/api/auth`)

#### `POST /api/auth/register`
- **Purpose**: Register a new user in the `users` table (sync Supabase Auth user to app DB)
- **Auth**: Yes (`get_current_user`)
- **Request headers**: `Authorization: Bearer <JWT>`
- **Request body**: None
- **Response schema**: The user row object: `{"id": "uuid", "email": "string", "role": "student", "created_at": "iso8601"}`
- **Internal flow**:
  1. Extract `sub` (user ID) and `email` from JWT via `get_current_user`.
  2. Query `users` table for existing row with `id == sub`.
  3. If exists, return the existing row.
  4. If not, insert `{"id": sub, "email": email, "role": "student"}` and return the inserted row.
- **DB tables**: `users`
- **Error responses**: 500 if insert fails, 401 if token invalid

#### `GET /api/auth/me`
- **Purpose**: Get current user's profile from the `users` table
- **Auth**: Yes (`get_current_user`)
- **Request headers**: `Authorization: Bearer <JWT>`
- **Response schema**: `{"id": "uuid", "email": "string", "role": "student|admin", "created_at": "iso8601"}`
- **Internal flow**:
  1. Extract `sub` from JWT.
  2. Query `users` table with `.select("*").eq("id", sub).single()`.
  3. Return the row or 404.
- **DB tables**: `users`
- **Error responses**: 404 "User profile not found. Please register first.", 401 if token invalid

---

### Menu Router (`/api`)

#### `GET /api/menu`
- **Purpose**: Get the most recent weekly menu
- **Auth**: No
- **Response**: The full menu row or `{"message": "No menu available"}`
- **Internal flow**: Query `weekly_menus` table ordered by `week_start_date` DESC, limit 1.
- **DB tables**: `weekly_menus`

#### `GET /api/menu/{week_start_date}`
- **Purpose**: Get menu for a specific week
- **Auth**: No
- **Path params**: `week_start_date` (string, e.g. "2026-02-17")
- **Response**: The menu row or `{"message": "No menu found for this week"}`
- **DB tables**: `weekly_menus`

#### `POST /api/admin/menu`
- **Purpose**: Upload/update weekly menu
- **Auth**: Yes (`require_admin`)
- **Request body** (Pydantic `WeeklyMenuCreate`):
  ```json
  {
    "week_start_date": "2026-02-17",
    "monday": {"breakfast": ["Poha","Tea"], "lunch": ["Rice","Dal"], "snacks": ["Biscuits"], "dinner": ["Roti","Sabzi"]},
    "tuesday": {...}, "wednesday": {...}, "thursday": {...},
    "friday": {...}, "saturday": {...}, "sunday": {...}
  }
  ```
- **Internal flow**:
  1. Check if a menu with the same `week_start_date` exists.
  2. If yes, **update** that row (upsert behavior).
  3. If no, **insert** a new row.
  4. Each day is serialized via `.model_dump()` to JSONB.
- **DB tables**: `weekly_menus`
- **Error responses**: 403 if not admin, 500 if DB operation fails

---

### Feedback Router (`/api`)

#### `GET /api/feedback`
- **Purpose**: List all feedback (public)
- **Auth**: No
- **Query params**: `limit` (int, default=50, max=100), `offset` (int, default=0)
- **Response**: Array of feedback objects. Anonymous feedback has `user_id` stripped. Image URLs are converted to signed URLs.
- **Internal flow**:
  1. Query `feedback` table ordered by `created_at` DESC with range pagination.
  2. For each item, call `_enrich_feedback()` to generate signed URLs for images.
  3. If `is_anonymous == true`, remove `user_id` from the response.
- **DB tables**: `feedback`

#### `POST /api/feedback`
- **Purpose**: Create new feedback with optional image
- **Auth**: Yes (`get_current_user`)
- **Content-Type**: `multipart/form-data`
- **Form fields**:
  - `category` (string, one of: quality, quantity, hygiene, suggestion) — required
  - `content` (string, min 10 chars, max 2000) — required
  - `is_anonymous` (bool, default false)
  - `image` (file, optional, max 1MB, types: jpeg/png/gif/webp)
- **Internal flow**:
  1. If image provided, upload to Supabase Storage via `storage_service.upload_image()`. Returns the storage path.
  2. Insert row into `feedback` table with `user_id`, `category`, `content`, `is_anonymous`, `image_url` (storage path), `upvotes: 0`.
  3. Enrich the response with a signed URL for the image.
- **DB tables**: `feedback`
- **External services**: Supabase Storage (upload)

#### `PUT /api/feedback/{feedback_id}`
- **Purpose**: Edit own feedback (within 24-hour window)
- **Auth**: Yes (`get_current_user`)
- **Path params**: `feedback_id` (string UUID)
- **Request body** (Pydantic `FeedbackUpdate`): `{"category": "quality", "content": "updated text"}` — both optional
- **Internal flow**:
  1. Fetch existing feedback by ID; 404 if not found.
  2. Verify `user_id == current_user.sub`; 403 if mismatch.
  3. Check if `now - created_at > 24 hours`; 403 if expired.
  4. Update only provided fields + set `updated_at`.
- **DB tables**: `feedback`
- **Error responses**: 404, 403 (not owner), 403 (edit window expired), 500

#### `POST /api/feedback/{feedback_id}/upvote`
- **Purpose**: Toggle upvote on feedback
- **Auth**: Yes (`get_current_user`)
- **Internal flow**:
  1. Fetch feedback; 404 if not found.
  2. Check `feedback_upvotes` table for existing upvote by this user.
  3. If already upvoted → delete the upvote row, decrement `upvotes` count (min 0).
  4. If not upvoted → insert upvote row, increment count.
  5. Update the `upvotes` column on the `feedback` row.
- **DB tables**: `feedback`, `feedback_upvotes`

#### `DELETE /api/admin/feedback/{feedback_id}`
- **Purpose**: Admin deletes feedback
- **Auth**: Yes (`require_admin`)
- **Internal flow**: Fetch feedback, delete associated image from Storage if exists, delete the feedback row.
- **DB tables**: `feedback`
- **External services**: Supabase Storage (delete)

#### `GET /api/admin/feedback/stats`
- **Purpose**: Get feedback statistics
- **Auth**: Yes (`require_admin`)
- **Response**: `{"total": 42, "by_category": {"quality": 12, "quantity": 8, "hygiene": 15, "suggestion": 7}}`
- **Internal flow**: Fetch all feedback rows, count total and group by category in Python.
- **DB tables**: `feedback`

---

### Expenses Router (`/api`)

#### `POST /api/expenses`
- **Purpose**: Create an expense
- **Auth**: Yes (`get_current_user`)
- **Request body** (Pydantic `ExpenseCreate`):
  ```json
  {"item_name": "Chai", "category": "drink", "amount": 15.00, "date": "2026-02-20"}
  ```
  - `item_name`: string, 1–200 chars
  - `category`: one of food, drink, snacks
  - `amount`: float, > 0, ≤ 100000
  - `date`: date (YYYY-MM-DD)
- **DB tables**: `expenses`

#### `GET /api/expenses`
- **Purpose**: Get current user's expenses
- **Auth**: Yes (`get_current_user`)
- **Query params**: `month` (optional, "YYYY-MM"), `limit` (default 100, max 500), `offset` (default 0)
- **Internal flow**: Filtered by `user_id`. If `month` provided, filters by `date >= YYYY-MM-01` and `date < YYYY-MM-32` (relies on Supabase handling invalid dates gracefully).
- **DB tables**: `expenses`

#### `GET /api/expenses/summary`
- **Purpose**: Get monthly spending summary
- **Auth**: Yes (`get_current_user`)
- **Query params**: `month` (required, "YYYY-MM")
- **Response**: `{"month": "2026-02", "total": 1250.50, "by_category": {"food": 800, "drink": 200, "snacks": 250.50}, "count": 25}`
- **Internal flow**: Fetches up to 1000 expenses for the month, aggregates in Python using `defaultdict`.
- **DB tables**: `expenses`

#### `DELETE /api/expenses/{expense_id}`
- **Purpose**: Delete own expense
- **Auth**: Yes (`get_current_user`)
- **Internal flow**: Fetch expense, verify ownership, delete.
- **DB tables**: `expenses`
- **Error responses**: 404, 403 (not owner)

---

### Admin Router (`/api/admin`)

#### `GET /api/admin/users`
- **Purpose**: List all users
- **Auth**: Yes (`require_admin`)
- **Response**: Array of user objects ordered by `created_at` DESC.
- **DB tables**: `users`

#### `PATCH /api/admin/users/{user_id}/role`
- **Purpose**: Update a user's role
- **Auth**: Yes (`require_admin`)
- **Path params**: `user_id` (string UUID)
- **Query params**: `role` (string, must be "student" or "admin")
- **Note**: The `role` parameter is received as a **query parameter**, not a request body. This is because the function signature is `def update_user_role(user_id: str, role: str, ...)` without a Pydantic body model.
- **Internal flow**: Validate role string, update `users` table.
- **DB tables**: `users`
- **Error responses**: Returns `{"error": "..."}` (not an HTTP error) if invalid role or user not found. This is a **design inconsistency** — errors should use `HTTPException`.

---

## 4. Database Architecture (Supabase)

### Supabase Initialization

**Backend** (`services/supabase_client.py`):
- Uses `create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)` with the **service role key**.
- The client is created as a **module-level singleton** at import time.
- If env vars are missing, `supabase` is set to `None` (which would cause `AttributeError` at runtime).

**Frontend** (`lib/supabase.ts`):
- Uses `createClient(supabaseUrl, supabaseAnonKey)` with the **anon key**.
- Used **only** for authentication (signup, login, session management, signOut).
- No direct database queries from the frontend.

### Tables

#### `users`
| Column | Type | Constraints |
|---|---|---|
| `id` | UUID | PRIMARY KEY (matches `auth.users.id`) |
| `email` | TEXT | UNIQUE, NOT NULL |
| `role` | TEXT | NOT NULL, DEFAULT 'student', CHECK IN ('student', 'admin') |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |

- **Purpose**: Application-level user profile synced from Supabase Auth.
- **Endpoints**: `/api/auth/register`, `/api/auth/me`, `/api/admin/users`, `/api/admin/users/{id}/role`, `require_admin` middleware
- **RLS**: Users can read own profile. Service role has full access.

#### `weekly_menus`
| Column | Type | Constraints |
|---|---|---|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() |
| `week_start_date` | DATE | NOT NULL, UNIQUE |
| `monday` – `sunday` | JSONB | NOT NULL, DEFAULT '{}' |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |

- **Purpose**: Stores weekly mess menu. Each day column contains JSONB with `{breakfast: [], lunch: [], snacks: [], dinner: []}`.
- **Index**: `idx_weekly_menus_week_start` on `week_start_date`
- **RLS**: Anyone can read. Service role has full access.

#### `feedback`
| Column | Type | Constraints |
|---|---|---|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() |
| `user_id` | UUID | NOT NULL, FK → users(id) ON DELETE CASCADE |
| `category` | TEXT | NOT NULL, CHECK IN ('quality','quantity','hygiene','suggestion') |
| `content` | TEXT | NOT NULL |
| `image_url` | TEXT | nullable |
| `is_anonymous` | BOOLEAN | NOT NULL, DEFAULT FALSE |
| `upvotes` | INTEGER | NOT NULL, DEFAULT 0 |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | nullable |

- **Indexes**: `idx_feedback_user_id`, `idx_feedback_created_at`, `idx_feedback_category`
- **RLS**: Anyone can read. Users can insert/update own. Service role has full access.

#### `expenses`
| Column | Type | Constraints |
|---|---|---|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() |
| `user_id` | UUID | NOT NULL, FK → users(id) ON DELETE CASCADE |
| `item_name` | TEXT | NOT NULL |
| `category` | TEXT | NOT NULL, CHECK IN ('food','drink','snacks') |
| `amount` | NUMERIC(10,2) | NOT NULL, CHECK > 0 |
| `date` | DATE | NOT NULL |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |

- **Indexes**: `idx_expenses_user_id`, `idx_expenses_date`
- **RLS**: Users can read/insert/delete own expenses. Service role has full access.

#### `feedback_upvotes`
| Column | Type | Constraints |
|---|---|---|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `feedback_id` | UUID | NOT NULL, FK → feedback(id) ON DELETE CASCADE |
| `user_id` | UUID | NOT NULL, FK → auth.users(id) ON DELETE CASCADE |
| `created_at` | TIMESTAMPTZ | DEFAULT now() |

- **Constraint**: UNIQUE(feedback_id, user_id) — one upvote per user per feedback
- **RLS**: Users can insert/delete own upvotes. Anyone can view all upvotes.
- **Note**: `user_id` references `auth.users(id)` (not `public.users(id)`). This is a subtle difference from the other tables.

### Triggers

**`on_auth_user_created`** (defined in `user_trigger.sql`):
- Fires AFTER INSERT on `auth.users`.
- Calls `public.handle_new_user()` which inserts a row into `public.users` with `role = 'student'`.
- Uses `ON CONFLICT (id) DO NOTHING` to handle race conditions with the backend's `/api/auth/register`.
- The function is `SECURITY DEFINER` (runs with the privileges of the function owner, bypassing RLS).

---

## 5. Authentication Flow

### Signup Flow
1. User enters email + password on `/login` page (mode = "register").
2. Frontend calls `supabase.auth.signUp({ email, password, options: { data: { role: "student" } } })`.
3. Supabase Auth creates a record in `auth.users`. The `on_auth_user_created` trigger fires and creates a `public.users` row.
4. On success, frontend shows "Account created! You can now sign in." and switches to login mode.
5. **Note**: Supabase may require email confirmation depending on project settings. The code does not handle the confirmation flow.

### Login Flow
1. User enters email + password on `/login` page (mode = "login").
2. Frontend calls `supabase.auth.signInWithPassword({ email, password })`.
3. On success, Supabase returns a session with `access_token` (JWT) and `refresh_token`.
4. The `AuthProvider`'s `onAuthStateChange` listener fires with the new session.
5. `AuthProvider` calls `fetchProfile()`:
   a. First tries `GET /api/auth/me` with the JWT.
   b. If 404 (profile doesn't exist yet), calls `POST /api/auth/register` to create it.
   c. Stores the profile in React state.
6. `router.push("/")` redirects to home.

### Token Storage
- The Supabase JS SDK manages tokens internally. By default, `@supabase/supabase-js` stores tokens in `localStorage` under keys like `sb-<ref>-auth-token`.
- The frontend never manually reads/writes tokens. It calls `supabase.auth.getSession()` to retrieve the current `access_token`.

### Token Refresh
- The Supabase JS SDK automatically refreshes expired tokens using the `refresh_token`. This happens transparently.
- The backend does **not** handle token refresh. It only validates the `access_token`.

### Backend JWT Verification (`auth_middleware.py`)
1. `HTTPBearer` extracts the token from `Authorization: Bearer <token>`.
2. `_decode_token()` reads the JWT header to determine the algorithm:
   - **ES256**: Fetches JWKS from `{SUPABASE_URL}/auth/v1/.well-known/jwks.json` (cached in `_jwks_cache`). Finds the key matching the `kid` in the token header. Decodes with that public key.
   - **HS256** (legacy/fallback): Decodes using the `SUPABASE_JWT_SECRET` environment variable.
3. Audience verification is **disabled** (`verify_aud: False`).
4. Extracts `sub`, `email`, `role`, `exp` from payload into `TokenPayload`.
5. If decoding fails → 401 "Invalid or expired token".

### Admin Authorization
1. `require_admin` depends on `get_current_user` to get the `TokenPayload`.
2. Queries `users` table for the user's role.
3. If role is not "admin" → 403 "Admin access required".
4. **Note**: The role is checked from the **database**, not from the JWT. This means role changes take effect immediately.

### Logout Flow
1. Frontend calls `supabase.auth.signOut()`.
2. `AuthProvider` clears `user`, `session`, and `profile` state.
3. Supabase JS SDK removes tokens from localStorage.

### Protected Routes (Frontend)
- `/expenses` page: `useEffect` checks `if (!authLoading && !user) router.push("/login")`.
- `/admin` page: `useEffect` checks `if (!authLoading && (!user || !isAdmin)) router.push("/")`.
- There is **no middleware-level protection**. Users can briefly see a loading skeleton before being redirected.

---

## 6. Frontend Architecture

### Routing Structure
| Route | Page Component | Auth Required | Description |
|---|---|---|---|
| `/` | `HomePage` | No | Landing page with feature cards |
| `/login` | `LoginPage` | No | Email/password login and registration |
| `/menu` | `MenuPage` | No | Weekly menu viewer with day tabs |
| `/feedback` | `FeedbackPage` | No (read), Yes (write) | Feedback list, submit form, upvote |
| `/expenses` | `ExpensesPage` | Yes | Personal expense tracker with charts |
| `/admin` | `AdminPage` | Yes (admin) | Menu upload, feedback moderation, user list |

### Page Rendering Strategy
All pages are **Client-Side Rendered (CSR)** — every page is marked `"use client"` and fetches data in `useEffect`.

### State Management
- **No Redux, Zustand, or other state library**. All state is managed via React `useState` hooks at the page level.
- **AuthContext** is the only cross-cutting state provider. It provides: `user`, `session`, `profile`, `isAdmin`, `loading`, `signOut`.

### Data Fetching Patterns
All pages follow the same pattern:
1. `useState` for data, loading, and error states.
2. `useEffect` on mount (or on dependency change) calls an async function.
3. The async function calls `apiGet`/`apiPost`/etc. from `lib/api.ts`.
4. On success, data is set in state. On failure, state is cleared or error is shown.

### Loading States
Every page implements skeleton loading using Tailwind's `animate-pulse` on placeholder divs.

### Form Validation
- Login: HTML5 `required`, `type="email"`, `minLength={6}` on password.
- Feedback: `minLength={10}`, `maxLength={2000}` on content. Image size checked client-side (1MB limit).
- Expenses: `required` on all fields, `min="0.01"`, `step="0.01"` on amount.
- **Note**: Client-side validation is supplemented by Pydantic validation on the backend.

---

## 7. API Communication Layer

### Base URL
Defined in `lib/api.ts`: `const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"`.

### Auth Header Injection
The `getAuthHeaders()` function calls `supabase.auth.getSession()` and, if a session exists, returns `{ Authorization: "Bearer <access_token>" }`.

### Exported Functions

| Function | Method | Content-Type | Usage |
|---|---|---|---|
| `apiGet<T>(path)` | GET | — | Menu, feedback list, expenses, summary, user profile |
| `apiPost<T>(path, body?)` | POST | application/json | Register, upvote, create expense |
| `apiPut<T>(path, body)` | PUT | application/json | Update feedback |
| `apiDelete<T>(path)` | DELETE | — | Delete expense, delete feedback (admin) |
| `apiPostForm<T>(path, formData)` | POST | multipart/form-data | Create feedback with image |

### Error Handling
All functions follow the same pattern:
1. Check `res.ok`.
2. If not ok, attempt to parse JSON for `detail` field.
3. Throw `new Error(err.detail || "API error: {status}")`.

### Missing Features
- **No retry logic**.
- **No request interceptors**.
- **No CSRF protection** (relies on CORS + Bearer tokens).
- **No request timeout configuration**.
- **No response caching**.

---

## 8. Environment Configuration

### Backend `.env`

| Variable | Purpose | Used In | Required |
|---|---|---|---|
| `SUPABASE_PROJECT_URL` | Supabase project base URL | `supabase_client.py`, `auth_middleware.py` | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (bypasses RLS) | `supabase_client.py` | Yes |
| `SUPABASE_JWT_SECRET` | JWT secret for HS256 verification | `auth_middleware.py` | Yes |
| `FRONTEND_URL` | Frontend URL for CORS origin | `main.py` | No (default: `http://localhost:3000`) |

### Frontend `.env.local`

| Variable | Purpose | Used In | Required |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `lib/supabase.ts` | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | `lib/supabase.ts` | Yes |
| `NEXT_PUBLIC_BACKEND_URL` | Backend API base URL | `lib/api.ts` | No (default: `http://localhost:8000`) |

### Unused/Referenced but Absent
- `BACKEND_BASE_URL` is referenced in `storage_service.py` but **never actually used** in any URL construction. This is dead code.

---

## 9. Middleware and Security

### CORS
Configured in `main.py`:
- **Origins**: `[FRONTEND_URL, "http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"]`
- **Credentials**: Allowed
- **Methods**: All (`*`)
- **Headers**: All (`*`)
- **Risk**: `allow_headers=["*"]` and `allow_methods=["*"]` are overly permissive for production.

### Rate Limiting
- Uses `slowapi` with `get_remote_address` as the key function.
- The limiter is attached to `app.state.limiter` and a `RateLimitExceeded` exception handler is registered.
- **However**, no endpoint actually applies `@limiter.limit()` decorator. Rate limiting is **configured but not active** on any route.

### Input Validation
- Pydantic models validate all structured request bodies.
- `FeedbackCreate.content`: min 10, max 2000 chars. `ExpenseCreate.amount`: > 0, ≤ 100000.
- File upload validation: content type checked against `ALLOWED_MIME_TYPES`, file size checked against 1MB `MAX_FILE_SIZE`.
- **Missing**: The `PATCH /api/admin/users/{user_id}/role` endpoint validates the role string manually but returns a JSON error body instead of raising an `HTTPException`.

### Supabase RLS
RLS is enabled on all tables. However, since the backend uses the **service role key**, all RLS policies are **bypassed** for backend operations. RLS only applies to direct client queries, which this application doesn't perform from the frontend (except via Supabase Auth, which operates on `auth.*` tables).

---

## 10. Background Tasks & Async Logic

### Image Cleanup Scheduler (`scheduler.py` + `cleanup_service.py`)
- **Technology**: APScheduler `BackgroundScheduler` (thread-based, not async).
- **Schedule**: Cron trigger, runs daily at **2:00 AM** server time.
- **Logic** (`delete_old_images()`):
  1. Calculate cutoff date: 30 days ago (`RETENTION_DAYS = 30`).
  2. Query `feedback` table for rows where `image_url IS NOT NULL` AND `created_at < cutoff`.
  3. For each matching row, delete the image from Supabase Storage and set `image_url = NULL` in the database.
  4. Return count of deleted images.
- **Lifecycle**: Started in FastAPI's `lifespan` context manager; stopped on shutdown.

### No WebSockets, Celery, or Other Async Workers
The application has no WebSocket endpoints, no Celery workers, and no other background processing beyond the APScheduler job.

---

## 11. Deployment Architecture

### Frontend (Vercel)
- **Build**: `npm run build` → `next build`
- **Start**: `npm run start` → `next start`
- **Environment**: Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_BACKEND_URL` in Vercel dashboard.
- **`next.config.mjs`**: Configures `images.remotePatterns` to allow images from `*.supabase.co` (for Next.js `<Image>` component, though the code uses standard `<img>` tags).

### Backend (Render)
- **Procfile**: `web: uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Environment**: Set `SUPABASE_PROJECT_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `FRONTEND_URL` in Render dashboard.
- No Docker configuration exists. Render auto-detects the Python environment from `requirements.txt`.

### No CI/CD Pipeline
There is no `.github/workflows`, no `Dockerfile`, no `docker-compose.yml`, and no CI/CD configuration.

---

## 12. Dependency Breakdown

### Backend (`requirements.txt`)

| Dependency | Version | Purpose | Critical |
|---|---|---|---|
| `fastapi>=0.115.0` | Latest | Web framework | Yes |
| `uvicorn[standard]>=0.34.0` | Latest | ASGI server | Yes |
| `python-jose[cryptography]>=3.3.0` | Latest | JWT decoding (HS256 + ES256) | Yes |
| `pydantic>=2.10.0` | Latest | Data validation / schemas | Yes |
| `supabase>=2.11.0` | Latest | Supabase Python SDK (DB + Storage) | Yes |
| `python-dotenv>=1.0.1` | Latest | Load `.env` files | Yes |
| `python-multipart>=0.0.20` | Latest | Multipart form data parsing (file uploads) | Yes |
| `apscheduler>=3.10.4` | Latest | Background job scheduling | Yes |
| `slowapi>=0.1.9` | Latest | Rate limiting | Optional (not actively used) |
| `httpx>=0.27.0` | Latest | HTTP client for JWKS fetching | Yes |
| `email-validator>=2.0.0` | Latest | Email validation for Pydantic `EmailStr` | Yes |

### Frontend (`package.json`)

| Dependency | Purpose | Critical |
|---|---|---|
| `next@^14.2.35` | React framework (App Router) | Yes |
| `react@^18.3.1` | UI library | Yes |
| `react-dom@^18.3.1` | React DOM renderer | Yes |
| `@supabase/supabase-js@^2.78.0` | Supabase client (auth only) | Yes |
| `lucide-react@^0.574.0` | Icon library | Yes (UI depends on it) |
| `recharts@^3.7.0` | Charting library (expenses page) | Yes |
| `papaparse@^5.5.3` | CSV parsing library | **Unused** — CSV export is done manually without PapaParse |
| `@tailwindcss/forms@^0.5.11` | Tailwind form element styles | Optional |
| `tailwindcss@^3.4.19` | CSS framework | Yes |
| `autoprefixer@^10.4.24` | PostCSS plugin | Yes (build) |
| `postcss@^8.5.6` | CSS processing | Yes (build) |
| `typescript@^5` | Type system | Yes (dev) |

**Note**: `papaparse` is listed as a dependency and `@types/papaparse` as a devDependency, but **neither is imported or used anywhere in the code**. The CSV export in `expenses/page.tsx` manually constructs CSV with `Array.join()`.

---

## 13. Data Flow Mapping

### User Signup
```
LoginPage → supabase.auth.signUp({email, password})
  → Supabase Auth creates auth.users row
    → on_auth_user_created trigger fires
      → INSERT INTO public.users (id, email, role='student')
  → Returns session to client
  → AuthProvider.onAuthStateChange fires
    → fetchProfile() → GET /api/auth/me → 404
      → POST /api/auth/register
        → Backend checks if user exists → inserts if not
      → Sets profile state
```

### User Login
```
LoginPage → supabase.auth.signInWithPassword({email, password})
  → Supabase Auth validates credentials
  → Returns session with access_token + refresh_token
  → AuthProvider.onAuthStateChange fires
    → fetchProfile() → GET /api/auth/me
      → Backend decodes JWT, queries users table
      → Returns user profile
    → Sets profile state
  → router.push("/")
```

### Authenticated API Call (e.g., Create Expense)
```
ExpensesPage → apiPost("/api/expenses", {...})
  → getAuthHeaders() → supabase.auth.getSession() → {Authorization: Bearer <JWT>}
  → fetch(BACKEND_URL + "/api/expenses", {method: POST, headers, body})
    → FastAPI receives request
    → get_current_user dependency extracts/validates JWT
    → Router calls expense_service.create_expense()
    → expense_service inserts into Supabase via service role client
    → Returns inserted row
  → UI calls fetchData() to refresh list
```

### Feedback with Image Upload
```
FeedbackPage → apiPostForm("/api/feedback", formData)
  → formData contains: category, content, is_anonymous, image (File)
  → FastAPI parses multipart form
  → get_current_user validates JWT
  → storage_service.upload_image(file, user_id)
    → Validates MIME type and file size
    → Generates path: {user_id}/{timestamp}_{uuid}.{ext}
    → Uploads to Supabase Storage bucket "feedback-images"
    → Returns the path (not full URL)
  → feedback_service.create_feedback(user_id, data, image_path)
    → Inserts row with image_url = storage path
  → _enrich_feedback() generates signed URL for the image
  → Returns enriched feedback object
```

---

## 14. Edge Cases & Failure Modes

### Network Failures
- Frontend `fetch` calls have no timeout. A hanging backend will cause indefinite loading.
- All `catch` blocks either silently swallow errors or set state to empty/null.
- No retry logic exists anywhere.

### Token Expiry
- Supabase JS SDK auto-refreshes tokens. If refresh fails, `getSession()` returns null, and API calls go without auth headers → 401/403 from backend.
- The frontend does **not** detect or handle 401 responses specially (no automatic redirect to login).

### Race Conditions
- The `on_auth_user_created` trigger and `POST /api/auth/register` both try to insert into `public.users`. The trigger uses `ON CONFLICT DO NOTHING`, preventing duplicate key errors. The register endpoint checks for existing rows first. However, there's a theoretical race between the check and insert in the register endpoint.
- Upvote toggling reads count, modifies, and writes. Two simultaneous upvotes could produce an incorrect count since the count is managed manually rather than via a database aggregate.

### Validation Edges
- Expense date filter uses `lt("date", "{YYYY-MM}-32")` which relies on Supabase treating "32" as beyond any valid month. This works but is unconventional.
- The admin role update uses query parameters for the role value, which could be accidentally cached or logged in URLs.

---

## 15. Observed Technical Debt / Risks

### Security Concerns
1. **Hardcoded secrets in `.env`**: The actual `.env` and `.env.local` files contain real Supabase credentials and are present in the repository (though gitignored, they were readable during analysis). The service role key grants full database access.
2. **No rate limiting enforced**: `slowapi` is configured but no endpoint uses `@limiter.limit()`.
3. **CORS is overly permissive**: `allow_headers=["*"]` and `allow_methods=["*"]`.
4. **Admin role endpoint returns JSON errors instead of HTTP errors**: Makes error handling inconsistent.
5. **JWKS cache is never invalidated**: If Supabase rotates keys, the backend must be restarted.

### Performance Concerns
1. **Feedback stats fetches ALL rows**: `get_feedback_stats()` does `select("*")` with no filter, loading every feedback row into memory.
2. **Monthly summary fetches up to 1000 rows**: Aggregation is done in Python, not SQL.
3. **No database connection pooling**: The Supabase client uses HTTP, but high concurrency could lead to connection issues.
4. **No pagination on admin feedback list**: Fetches up to 100 items for the admin panel.

### Architectural Concerns
1. **`supabase` client initialized at module level**: If credentials are missing, it's set to `None`, causing `AttributeError` at runtime rather than a clean startup failure.
2. **`papaparse` is an unused dependency**.
3. **`BACKEND_BASE_URL` in `storage_service.py` is defined but never used**.
4. **No automated tests exist** — no test files, no test configuration.
5. **No Next.js middleware for auth** — route protection is purely client-side, meaning HTML/JS for protected pages is sent to the browser before auth check.
6. **Upvote count is denormalized**: The `upvotes` integer on `feedback` is manually incremented/decremented rather than computed from `feedback_upvotes` count, creating potential drift.
7. **`MealItem` model in `models/menu.py` is defined but never used** — menus use raw string lists.
8. **`has_user_upvoted` function in `feedback_service.py` is defined but never called** by any router.
9. **`UserCreate` model in `models/user.py` is defined but never used** — the register endpoint builds the insert dict manually.
10. **`UserOut` and `WeeklyMenuOut` Pydantic models are defined but never used** as response models — endpoints return raw dicts from Supabase.

---

*End of Technical Blueprint*

# TEST

This file lists the commands to run the backend and frontend locally for testing.

Prerequisites
- Python 3.10+ and pip
- Node.js 18+ and npm
- PostgreSQL (or Neon) and a `DATABASE_URL` connection string

Backend — local development (PowerShell)

```powershell
# create and activate venv
python -m venv .venv
.\.venv\Scripts\Activate

# install dependencies
pip install -r backend/requirements.txt

# copy and edit environment file
copy backend\.env.example backend\.env
# Edit backend\.env and set DATABASE_URL and JWT secret values

# run alembic migrations (ensure DATABASE_URL is set)
cd backend
alembic upgrade head
cd ..

# start development server (auto-reload)
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend — production (example)

```powershell
# ensure env vars are set (DATABASE_URL, JWT_SECRET, etc.)
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

Alembic (if using the backend folder directly)

```powershell
cd backend
alembic -c alembic.ini upgrade head
```

Frontend — local development

```powershell
cd web
npm install

# create .env.local with the API URL (example)
echo NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api > .env.local

# start Next.js dev server
npm run dev
```

Frontend — build and start (production)

```powershell
cd web
npm install
npm run build
npm run start
```

Quick API smoke tests (bash or PowerShell curl)

1) Register a user

```bash
curl -X POST http://127.0.0.1:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"me@example.com","password":"password123","username":"me"}'
```

2) Login to get token

```bash
curl -X POST http://127.0.0.1:8000/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d 'username=me@example.com&password=password123'

# copy the returned access_token from the response
```

3) Use token to call protected endpoint

```bash
TOKEN=<<PASTE_TOKEN_HERE>>
curl -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8000/api/tasks
```

Notes
- Edit `backend/.env` from `backend/.env.example` before running to set `DATABASE_URL` and JWT secrets.
- If using Neon or hosted Postgres, set `DATABASE_URL` to the provided connection string before running migrations.
- The frontend reads `NEXT_PUBLIC_API_URL` (set in `web/.env.local`) and expects the backend API at `<url>/api`.

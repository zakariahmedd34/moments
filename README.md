# moments

**Capture a moment.** A visual daily journal: take a photo, write one short thought, and it lands in a journal grouped by day. You can browse everyone's days, only your own, or one person's journal.

- **Backend:** FastAPI, SQLAlchemy (async), fastapi-users (JWT login), ImageKit for photo storage
- **Frontend:** React 19, TypeScript, Vite, React Router

![The journal view: days on the left, the selected day's moments on the right](docs/screenshots/journal.png)
---

## Features

- **Accounts.** Sign up with email, username, and password. Sign in with your email, your username, or `@username`.
- **Journal split view.** Days are listed on the left, each with a small photo stack. The selected day's moments show on the right. *Today* is always in the list.
- **Everyone / Mine.** Switch between all moments and only yours.
- **User journals.** Click any `@username` to open that person's journal, with their moment and day counts.
- **Open Diary.** Click a moment to open it as a two-page spread: photo on the left, time and thought on the right. Use the arrow keys to move through the day and Esc to close. You can delete your own moments.
- **Capture.** Drag, paste, or pick a photo and write up to 280 characters. Big photos are resized in the browser and camera location data (GPS) is removed before upload.
- **Works on phones.** On a small screen, the day list and the day view become separate screens.
- **One app or two servers.** Develop with hot reload on two servers, or build once and FastAPI serves everything from one URL.

### Welcome and sign in

A two-step sign in: first your email or username, then your password.

![Welcome screen](docs/screenshots/welcome.png)

### Create an account

![Sign-up form](docs/screenshots/sign-up.png)

### Journal (Everyone)

The main screen. The sidebar holds the Capture button, the Everyone/Mine switch, the list of days, and your account.

![Journal view](docs/screenshots/journal.png)

### Open Diary

Opens when you click a moment. The URL changes to `?moment=<id>`, so you can share or reload it.

![Open Diary spread](docs/screenshots/open-diary.png)

### Capture a moment

The date and time fill in by themselves. You add a photo and a thought.

![Capture dialog](docs/screenshots/capture.png)

### A user's journal

`/u/leo`: the same split view, showing only that person's moments.

![User journal](docs/screenshots/user-journal.png)

### On a phone

<table>
  <tr>
    <td><img src="docs/screenshots/mobile-days.png" alt="Day list on a phone" width="300"></td>
    <td><img src="docs/screenshots/mobile-day.png" alt="One day on a phone" width="300"></td>
  </tr>
</table>

### Interactive API docs

FastAPI builds these docs automatically at `/api/docs`. You can call every endpoint from here.

![Swagger API docs](docs/screenshots/api-docs.png)


---

## How the system works

### The big picture

The browser only talks to **one address**. Every request that starts with `/api` goes to FastAPI. Everything else is the React app.

```mermaid
flowchart LR
    subgraph dev["Development: 2 servers"]
        B1["Browser<br/>localhost:5173"] --> V["Vite dev server<br/>React + hot reload"]
        V -- "/api/* is forwarded" --> F1["FastAPI<br/>localhost:8000"]
    end

    subgraph prod["One app: after npm run build"]
        B2["Browser<br/>localhost:8000"] --> F2["FastAPI<br/>localhost:8000"]
        F2 -- "/api/*" --> R["API routes"]
        F2 -- "any other path" --> D["frontend/dist<br/>built React app"]
    end

    F1 --> DB[("SQLite<br/>backend/moments.db")]
    R --> DB
    F1 --> IK["ImageKit<br/>photo storage + CDN"]
    R --> IK
```

- **In development**, `vite.config.ts` forwards `/api/...` to FastAPI on port 8000. You get instant reload on both sides.
- **As one app**, `npm run build` writes the React app into `frontend/dist`. When FastAPI starts and finds that folder, it serves the files, and any unknown path (like `/mine/day/2026-09-12`) gets `index.html`, so React Router can show the right page.
- **The frontend code is the same in both modes.** It always calls `/api/...` on the same address, so CORS isn't needed.

### Backend layers

Each layer only uses the layers below it:

```mermaid
flowchart TD
    routes["api/routes<br/>HTTP: read the request, return a response"]
    services["services<br/>logic + outside services (users, ImageKit)"]
    schemas["schemas<br/>JSON shapes (Pydantic)"]
    models["models<br/>database tables (SQLAlchemy)"]
    db["db<br/>engine + session"]
    core["core<br/>config (.env) + security (JWT)"]

    routes --> services
    routes --> schemas
    services --> models
    models --> db
    routes -.-> core
    services -.-> core
```

### Signing in

```mermaid
sequenceDiagram
    participant U as Browser (React)
    participant A as FastAPI
    participant D as Database

    U->>A: POST /api/auth/jwt/login (username or email + password)
    A->>D: find user by email or username
    D-->>A: user + password hash
    A->>A: check password (hashed with argon2/bcrypt)
    A-->>U: { access_token } (JWT, lasts 7 days)
    U->>U: save token in localStorage
    U->>A: GET /api/users/me (Authorization: Bearer token)
    A-->>U: { id, email, username, ... }
```

Every later request sends the `Authorization: Bearer <token>` header. If the server answers **401** (the token expired or is invalid), the app signs you out and shows the welcome screen.

### Capturing a moment

```mermaid
sequenceDiagram
    participant U as Browser (React)
    participant A as FastAPI
    participant I as ImageKit
    participant D as Database

    U->>U: resize to max 2560px, re-encode JPEG (removes GPS data)
    U->>A: POST /api/upload (multipart: file + caption, Bearer token)
    A->>A: check token, caption ≤ 280, file is image/video
    A->>I: upload file
    I-->>A: public URL + file name
    A->>D: INSERT post
    A-->>U: the new moment (JSON)
    U->>U: add it to the feed and open its day
```

If the ImageKit upload fails, the API answers **502** and the Capture dialog keeps your photo and text, so you can try again.

---

## Project structure

```text
moments/
├── backend/                         FastAPI server (Python)
│   ├── app/
│   │   ├── main.py                  creates the app, serves the React build
│   │   ├── api/
│   │   │   ├── router.py            puts every route under /api (+ /api/health)
│   │   │   └── routes/
│   │   │       ├── auth.py          register, login, logout, password reset, verify
│   │   │       ├── users.py         /users/me and user admin
│   │   │       └── posts.py         feed, upload, delete
│   │   ├── core/
│   │   │   ├── config.py            reads settings from backend/.env
│   │   │   └── security.py          JWT login setup (fastapi-users)
│   │   ├── db/
│   │   │   ├── base.py              SQLAlchemy Base class
│   │   │   └── session.py           engine, one session per request, create tables
│   │   ├── models/                  database tables: user.py, post.py
│   │   ├── schemas/                 request/response shapes: user.py, post.py
│   │   └── services/
│   │       ├── users.py             UserManager: unique usernames, login by email or username
│   │       └── imagekit.py          uploads files to ImageKit
│   ├── .env.example                 copy to .env and fill in
│   ├── .python-version              Python 3.13
│   ├── pyproject.toml               dependencies (managed by uv)
│   └── uv.lock
│
├── frontend/                        React app (TypeScript + Vite)
│   ├── public/                      static files (app icon)
│   ├── src/
│   │   ├── main.tsx, App.tsx        app start and page routes
│   │   ├── pages/                   WelcomePage, JournalPage
│   │   ├── components/              Sidebar, DayList, DayView, MomentCard,
│   │   │                            MomentDiary, CaptureDiary, ConfirmDialog, ...
│   │   ├── context/                 AuthProvider: who is signed in
│   │   ├── hooks/                   useAuth, useFeed
│   │   ├── services/                api.ts (fetch + friendly errors), auth.ts, moments.ts
│   │   ├── styles/                  tokens.css (colors, sizes), base, components, pages
│   │   ├── types/                   shared TypeScript types
│   │   └── utils/                   dates, day grouping, image resize
│   ├── package.json
│   └── vite.config.ts               dev proxy: /api → FastAPI
│
├── docs/
│   ├── screenshots/                 images used in this README
│   └── design/                      design references
├── .gitignore
└── README.md
```

---

## Getting started

### What you need

| Tool | Version | Check with |
| --- | --- | --- |
| Python | 3.13+ | `python --version` |
| [uv](https://docs.astral.sh/uv/) | 0.12+ | `uv --version` |
| Node.js | 20+ (tested on 24) | `node --version` |
| An [ImageKit](https://imagekit.io) account | free plan works | only needed to upload photos |

### 1. Backend

```powershell
cd backend
Copy-Item .env.example .env      # macOS/Linux: cp .env.example .env
```

Open `backend/.env` and fill it in (see [Configuration](#configuration)). Then:

```powershell
uv sync                                   # creates backend/.venv and installs packages
uv run uvicorn app.main:app --reload      # http://localhost:8000
```

The database file `backend/moments.db` and its tables are created on first start.

### 2. Frontend (in a second terminal)

```powershell
cd frontend
npm install
npm run dev                               # http://localhost:5173
```

Open **http://localhost:5173**. The API docs are at **http://localhost:8000/api/docs**.

### Run everything as one app

```powershell
cd frontend
npm run build                             # writes frontend/dist

cd ../backend
uv run uvicorn app.main:app               # http://localhost:8000 serves UI + API
```

Open **http://localhost:8000**. FastAPI only looks for `frontend/dist` when it starts, so restart it after you build.

### Useful commands

| Where | Command | What it does |
| --- | --- | --- |
| `backend/` | `uv run uvicorn app.main:app --reload` | start the API, reload on code changes |
| `backend/` | `uv add <package>` | add a Python dependency |
| `frontend/` | `npm run dev` | start the UI with hot reload |
| `frontend/` | `npm run build` | type-check and build for production |
| `frontend/` | `npm run lint` | lint with oxlint |
| `frontend/` | `API_TARGET=http://127.0.0.1:8001 npm run dev` | point the dev UI at a backend on another port |

---

## Configuration

All backend settings live in `backend/.env`. That file is in `.gitignore`, so never commit it. `backend/.env.example` is the template.

| Variable | Required | Default | What it is |
| --- | --- | --- | --- |
| `JWT_SECRET` | **yes** | – | Secret that signs login tokens. Make one: `uv run python -c "import secrets; print(secrets.token_hex(32))"` |
| `IMAGEKIT_PRIVATE_KEY` | for uploads | – | ImageKit private API key |
| `IMAGEKIT_PUBLIC_KEY` | for uploads | – | ImageKit public API key |
| `IMAGEKIT_URL` | for uploads | – | Your URL endpoint, e.g. `https://ik.imagekit.io/your_id` |
| `DATABASE_URL` | no | SQLite at `backend/moments.db` | Any async SQLAlchemy URL, e.g. `postgresql+asyncpg://user:pass@host/moments` (install `asyncpg` first) |
| `JWT_LIFETIME_SECONDS` | no | `604800` (7 days) | How long a login lasts |
| `FRONTEND_DIST` | no | `frontend/dist` | Folder of the built React app |

If `JWT_SECRET` is missing, the server stops at startup with a clear message.

---
**A Moment looks like this:**

```json
{
  "id": "0d9f4c1e-5a0b-4a47-9a55-0f2f0c1b8a11",
  "user_id": "5b1e0c1a-7c7a-4d7e-8a0c-2d6c8f7e9b10",
  "username": "zakaria",
  "caption": "First coffee before the city wakes up.",
  "url": "https://ik.imagekit.io/your_id/coffee_Ab12.jpg",
  "file_type": "image",
  "file_name": "coffee_Ab12.jpg",
  "created_at": "2026-09-12T01:36:00Z",
  "is_owner": true
}
```

`created_at` is always UTC. The frontend turns it into your local time and local day. `is_owner` says whether the signed-in user made the moment.



## Data model

```mermaid
erDiagram
    USER ||--o{ POSTS : writes
    USER {
        uuid id PK
        string email UK
        string username UK "3-20 chars, lowercase"
        string hashed_password
        bool is_active
        bool is_superuser
        bool is_verified
    }
    POSTS {
        uuid id PK
        uuid user_id FK
        text caption "max 280 (checked by the API)"
        string url "ImageKit URL"
        string file_type "image or video"
        string file_name
        datetime created_at "UTC"
    }
```

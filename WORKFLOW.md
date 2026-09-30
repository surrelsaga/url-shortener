# Workflow

How to set up and run each part of the project, and how a request flows through it.

## 1. Backend setup

### The big picture

```
browser / curl / React ──HTTP──▶ Fastify (:3000) ──▶ Drizzle ──▶ pg ──▶ Postgres (:5432)
                                  server/src/         builds SQL   sends it   stores the urls table
```

Two programs must be running: **Postgres** (the database server) and **Fastify** (my server).

### Files

```
server/
├── src/
│   ├── index.ts        Fastify app + all routes (/health, POST /api/urls, GET /:code)
│   ├── db.ts           connects to Postgres, exports `db`
│   └── schema.ts       the urls table in TypeScript (source of truth for the table)
├── drizzle/            migration SQL files, generated from schema.ts (committed)
├── drizzle.config.ts   tells drizzle-kit where schema.ts and drizzle/ are
├── .env                DATABASE_URL (secret, NOT committed)
├── .env.example        same keys with fake values (committed)
├── package.json        dependencies + scripts
└── tsconfig.json       type checker settings (checks only, Node runs .ts directly)
```

### Setup from zero (new machine)

| # | Step | Command | Why |
|---|---|---|---|
| 1 | Node 24 | `node -v` | runs `.ts` directly (D02) |
| 2 | Install Postgres | `brew install postgresql@18` | the database server |
| 3 | Put `psql` etc. on PATH | `echo 'export PATH="/opt/homebrew/opt/postgresql@18/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc` | Homebrew doesn't do it for `@18` |
| 4 | Start Postgres | `brew services start postgresql@18` | runs in background, also after reboot |
| 5 | Create the database | `createdb url_shortener` | one empty database for this project |
| 6 | Install packages | `cd server && npm install` | reads `package.json` |
| 7 | Create `.env` | `cp .env.example .env`, then set `DATABASE_URL=postgres://<whoami>@localhost:5432/url_shortener` | where the database is |
| 8 | Create the table | `npm run db:migrate` | runs `drizzle/*.sql` this db hasn't run yet |
| 9 | Start the server | `npm run dev` | Fastify on :3000, restarts on save |
| 10 | Check | `curl localhost:3000/health` → `{"status":"ok"}` | proves Fastify → Postgres works |

### Every day

```bash
brew services start postgresql@18   # only if it's stopped (brew services list)
cd server && npm run dev
```

### Commands

| Command | What it does |
|---|---|
| `npm run dev` | start Fastify, reload on file save |
| `npm run typecheck` | check types, runs nothing (run before committing) |
| `npm test` | end-to-end API test (needs `npm run dev` running), cleans up its own rows |
| `npm run db:generate` | `schema.ts` changed → write a new migration file in `drizzle/` |
| `npm run db:migrate` | apply migration files this database hasn't run yet |
| `psql url_shortener -c 'SELECT * FROM urls'` | look at the stored links |

### How a request flows

**Create a short URL**
```
POST /api/urls  { "longUrl": "https://youtube.com" }
  → Fastify matches POST /api/urls, parses the JSON body
  → validate: string + http(s)? no → 400 { error }                              (D07)
  → generateCode(): 7 random URL-safe chars                                       (D06)
  → db.insert(urls) → Drizzle builds INSERT ... VALUES ($1, $2) → pg → Postgres
      code already taken? Postgres rejects (23505) → new code, retry (max 3)      (D04, D08)
  → 201 { "shortUrl": "http://localhost:3000/a8K2x" }
```

**Follow a short URL**
```
GET /a8K2x
  → Fastify matches GET /:code, code = "a8K2x"
  → db.select(...).where(code = "a8K2x") → Drizzle builds SELECT ... WHERE code = $1 → Postgres
  → no row → 404 "Short link not found"                                           (D09)
  → row    → 302, Location: https://youtube.com → browser goes there by itself    (D03)
```

### Changing the table

```
edit src/schema.ts
  → npm run db:generate   writes drizzle/000X_*.sql (the ALTER TABLE)
  → npm run db:migrate    applies it to my database
  → npm run typecheck     shows every query that no longer matches → fix them
  → commit schema.ts + the new drizzle/ file together
```

### When something breaks

| I see | Meaning | Check |
|---|---|---|
| connection refused / can't reach | Fastify isn't running | `npm run dev` |
| `500` + connect error in Fastify log | Postgres isn't running | `brew services start postgresql@18` |
| `DATABASE_URL is not set` on startup | no `.env` | step 7 |
| `relation "urls" does not exist` | table not created in this database | `npm run db:migrate` |
| `400` | my request is wrong (key must be `longUrl`, value an http(s) URL) | the request body |

## 2. Frontend

### Setup

```bash
cd client
npm install
npm run dev          # React on :5173 (backend must be running on :3000)
```
Open `http://localhost:5173`.

### How it talks to the backend

```
browser (:5173) ──fetch('/api/urls')──▶ Vite dev server ──proxy──▶ Fastify (:3000)
```
- only `/api/...` is proxied (`client/vite.config.ts`), so the browser never talks to another origin (D11)
- the short link itself (`http://localhost:3000/a8K2x`) goes straight to Fastify, not through Vite

### Files

```
client/
├── src/App.tsx       the whole UI: input, button, fetch, show result
├── src/main.tsx      mounts <App /> into index.html
├── index.html        the one HTML page
└── vite.config.ts    React plugin + /api proxy
```

## 3. Deploy (Render + Neon)

One service: Fastify serves the API and the built React app (D14).

### Database (Neon)
1. Sign up at neon.tech → create a project
2. Copy the connection string (`postgresql://...neon.tech/neondb?sslmode=require`)

### Server (Render)
1. Push the repo to GitHub (`git push`)
2. render.com → **New → Web Service** → connect the GitHub repo
3. Settings:

| Field | Value |
|---|---|
| Root Directory | *(empty = repo root)* |
| Build Command | `cd client && npm ci --include=dev && npm run build && cd ../server && npm ci --include=dev && npm run db:migrate` |
| Start Command | `cd server && npm start` |
| Instance Type | Free |

4. Environment variables:

| Key | Value |
|---|---|
| `DATABASE_URL` | the Neon connection string |
| `HOST` | `0.0.0.0` |
| `PUBLIC_URL` | copy the exact URL Render shows (e.g. `https://dan-shorten-url.onrender.com`). Render picks it from the service name at creation, a taken name gets a random suffix |
| `NODE_VERSION` | `24` (only if the build log shows an older Node; `.node-version` should cover it) |

5. Deploy → open the URL → shorten a link → click it

### After that
- every `git push` to main → Render rebuilds and redeploys (build runs `db:migrate`, so new migrations are applied automatically)
- server sleeps after ~15 min idle → first request takes ~30-60s

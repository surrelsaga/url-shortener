# URL Shortener

Paste a long URL, get a short one. Opening the short link redirects to the original.

My first full-stack app, built as a learning project: React → Fastify → Drizzle → PostgreSQL.

**Live:** https://dan-shorten-url.onrender.com

## Project structure

```
url-shortener/
├── client/                 frontend (React + TypeScript + Vite)
│   ├── src/App.tsx         the whole UI: input box, output box, calls the API
│   ├── src/index.css       styles
│   └── vite.config.ts      dev server, forwards /api to the backend
├── server/                 backend (Node + TypeScript + Fastify)
│   ├── src/index.ts        routes: POST /api/urls (create), GET /:code (redirect), /health
│   ├── src/db.ts           database connection
│   ├── src/schema.ts       the urls table (Drizzle)
│   ├── drizzle/            migrations generated from schema.ts
│   └── test/api.test.ts    end-to-end API test
├── DECISIONS.md
├── NOTES.md
└── WORKFLOW.md
```

## Docs

- **DECISIONS.md**: every design decision I made, with the options, why I chose one, and what it cost.
- **NOTES.md**: what I learned at each milestone, the bugs I hit, and how I fixed them.
- **WORKFLOW.md**: full setup, how a request flows through the app, and how to deploy.

## Run locally

Needs Node 24 and PostgreSQL.

```bash
createdb url_shortener

cd server
npm install
cp .env.example .env     # set DATABASE_URL=postgres://<your-user>@localhost:5432/url_shortener
npm run db:migrate       # create the table
npm run dev              # API on http://localhost:3000

cd ../client             # in a second terminal
npm install
npm run dev              # app on http://localhost:5173
```

Details, troubleshooting and deployment: see WORKFLOW.md.

## Credits

Icon: [url](https://iconscout.com/icons/url) by [Flowicon](https://iconscout.com/contributors/flowicon) on [IconScout](https://iconscout.com)

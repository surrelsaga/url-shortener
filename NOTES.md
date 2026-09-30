# Notes

Stuffs that confuse me here, --what bugs I hit, how I resolve it, useful commands, etc.

## Milestone 1: Project intialization

a leading `/` in `.gitignore` means only ignoring directories that lies in the root directory, in which the `.gitignore` lives in

## Milestone 2: Frontend setup (react + vite)

Vite (bundler): some setup to compile Typescript and react `jsx/tsx` to plain JS for the browser to be able to run those code

Vite dev server: 
- program running on laptop waiting for requests at `http://localhost:5173`. 
- Browser open that address, asks Vite for files -> Vite reads from `client`, converts typesciprt/jsx into plain JS, sends them back to browser to execute. 
- It's only for `development` time. When deploy, `npm run build` compiles plain JS file in `client/dist/` with `index.html`, no more Vite server

How Vite files work:
- index.html -> src/main.tsx -> src/App.tsx
- main.tsx finds the empty `#root` div in `index.html` and tells React to render `<App />` inside that div.
- App.tsx is the UI, frontend code

`useState` in App.tsx when I trim boiletplate, I never remove. `npm run dev` still works since it only launches a vite server to run source code, but `npm run build` won't work since it also runs the typesript compiler, the compiler don't allow declared stuffs that is not used (so got error)

## Milestone 3: build a Fastify server

When intializing a Fastify app, why receive `404` after trying to access the server address means success? -> It's because, browser will send a `GET` request to `/` (which does not exist), so it returns 404 json. This proves that the server is working since it needs to receive the request, process, and reply with a status json

`node --watch`: restart server when code changes

## Milestone 4: writing first route (server health check)

1. app.get('/some-path', async (request, reply) => {
  return /* something */
})

- The handler is the function Fastify calls when a matching request arrives.
  - request is everything that came in: headers, URL parameters, body.
  - reply lets you control the response: the status code, headers, or a redirect. We'll need that for the redirect in milestone 11.
- Whatever you return becomes the response. If you return an object, Fastify turns it into JSON, sets the content-type: application/json header, and uses status 200 automatically.

2. Fastify vs Express:
- Express: Express app keeps all the routes in a list, and walks through that list on every request so adding routes after app.listen() is just adding 1 item to that list so it works
- Fastify: Fastify builds an optimized lookup structure from all the routes first. After that, the routing is locked and the app starts `listen()` for requesting so adding new path after `app.listen()` won't work.

## Milestone 5: document on HTTP request/response flow of the product

Convention of designing api endpoints: (protocol)/://(host:port)/(app_context)/(version)/(resource)/(id)
- any endpoints, path should name the resource and method is the verb (like the eg above, `url` not `shorten-url`)

e.g: http://localhost:3000/api/v1/url/url-id

For reference: https://medium.com/@nadinCodeHat/rest-api-naming-conventions-and-best-practices-1c4e781eb6a5

## Milestone 6: install PostgreSQL (setup commands, how postgres run)

goal: having a Postgres server running on my mac, with empty database for this project

definition: postgres is a server program, runs in background and wait for connects on a port (5432 by default). It doesn't speak HTTP but its own protocol. It answer SQL queries made from the server, the fastify is the Postgres's client

e.g: browser ---HTTP---> Fastify server :3000 --Postgres protocol---> Postgre server :5432

**ONE** Postgres server can hold **MANY** separate databases. Later, create one called url_shortener for this project. We'll store a table of long urls inside it

### Steps to install and play around

1. Install:
brew install postgresql@18
Homebrew also runs initdb for you. That creates the data folder where Postgres stores everything, with your macOS username as the admin user.

2. Put the Postgres commands on your PATH. Homebrew doesn't do this automatically for versioned formulas like @18:
echo 'export PATH="/opt/homebrew/opt/postgresql@18/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
psql --version
This makes commands like `psql` (the Postgres terminal client) available everywhere. `psql --version` should print 18.x.

3. Start the server:
brew services start postgresql@18
`brew services` runs Postgres in the background and starts it again whenever you log in. You don't need a terminal open, unlike your Vite and Fastify servers.

4. Connect and look around:
psql postgres
This opens a SQL prompt (postgres=#) connected to the built-in default database called postgres. Try:
```sql
-- try line by line
SELECT version();
\l
\q
```
- SELECT version(); is your first SQL query. Note the ;: SQL statements need one.
- \l lists the databases.
- \q quits.

Commands starting with `\` are `psql` shortcuts, not SQL.

5. Create the project's database:
createdb url_shortener
psql url_shortener
Inside, run `\dt`, which lists tables. It should say "Did not find any relations": an empty database, ready for milestone 9.

Break it on purpose

Run `brew services stop postgresql@18`, then `psql url_shortener` again. Read the error. Which row of the debugging table from milestone 3 does it match? (it can't connect since postgres isn't running) Then start the server again.

## Milestone 7: learn database concepts and design the urls table

goal: design the table on paper, no code. It will become a schema later

The concepts, how the table look in the database

```
database: url_shortener
└── table: urls
    ┌────┬────────┬───────────────────────────────┐
    │ id │ code   │ original_url                  │  ← columns (each has a name + a type)
    ├────┼────────┼───────────────────────────────┤
    │ 1  │ a8K2x  │ https://youtube.com           │  ← a row = one shortened link
    │ 2  │ Zp91q  │ https://example.com/long/...  │
    └────┴────────┴───────────────────────────────┘
```

- column: a named field with a `type` and does have rules (e.g: `NOT NULL`)
- row: one record. Every `POST` to `/api/urls` will add 1 row
- Primary key: column to identify each link in 1 row. This cannot be **EMPTY** or **DUPLICATED**.
- Index: first column, just to keep everything in order and server for indexing purposing like scanning the first 10 rows or sth.
- SQL query: extract specific row/column based on the constraint in the query

all design decisions of the table that relates to the API endpoints are in [here](DECISIONS.md#decision-04-design-the-urls-table-to-work-with-api-endpoints)


## Milestone 8: Connect Fastify server to Postgres with pg (a package) to write SQL queries in node

SQL query -> `pg` (npm package) -> Postgres :5432

Step 0: start Postgres
brew services start postgresql@18

Step 1: install the driver (from server/)
npm install pg
npm install -D @types/pg
`pg` sends your SQL to Postgres. `@types/pg` is for the type checker only.

Step 2: server/.env (ignored by Git)
DATABASE_URL=postgres://YOUR_MAC_USERNAME@localhost:5432/url_shortener
Run whoami to get your username. There's no password, because Homebrew's Postgres trusts local connections.

Step 3: server/.env.example (committed)
DATABASE_URL=postgres://USER:PASSWORD@localhost:5432/url_shortener

Step 4: load .env in the dev script (server/package.json)
"dev": "node --env-file=.env --watch src/index.ts",

Step 5: server/src/db.ts
import pg from 'pg'

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL is not set')

export const pool = new pg.Pool({ connectionString: url })
- Pool: keeps a few connections open and reuses them, because opening a new one per request is slow.
- The if check: environment variables are input from outside your code, so fail loudly at startup if one is missing.

Step 6: query the database in /health (server/src/index.ts)
import { pool } from './db.ts'

app.get('/health', async () => {
  await pool.query('select 1')
  return { status: 'ok' }
})

Test

1. npm run typecheck should pass.
2. npm run dev, then curl -i localhost:3000/health should give 200 and {"status":"ok"}.
3. Stop Postgres (brew services stop postgresql@18) and curl again. What status do you get, and why isn't it "connection refused"?
  - status 500, meaning internal server error, not "connection refused". Fasity is still running. It's fasitfy's connection to postgres that failed
4. Start Postgres again and curl. Why does it recover without restarting Fastify?
  -  Everytime there's a request to server `/heatlh`, the server will connects with Postgres again so it only depends on whether the Postgres server is still running, if it is then the fastify will connect to it succesfully if it runs again. `pool` opens a fresh connection on the next `query`.
5. Rename .env temporarily and restart. Which line throws? Then rename it back.
  - the database address is wrong so need to fix it
6. git status should show .env.example but not .env.


Why the setting up for SQLite is simpler and more natural than Postgresql

```
┌────────────────────────────┬─────────────────┬───────────────────────────────────────────────────────────┐
│                            │     SQLite      │                         Postgres                          │
├────────────────────────────┼─────────────────┼───────────────────────────────────────────────────────────┤
│ Where the database lives   │ a file (app.db) │ inside a separate server program                          │
├────────────────────────────┼─────────────────┼───────────────────────────────────────────────────────────┤
│ To use it                  │ open the file   │ connect over the network: needs an address (DATABASE_URL) │
├────────────────────────────┼─────────────────┼───────────────────────────────────────────────────────────┤
│ Must be running first?     │ no              │ yes (brew services start)                                 │
├────────────────────────────┼─────────────────┼───────────────────────────────────────────────────────────┤
│ Handles many users at once │ limited         │ yes, which is why real web apps use it                    │
└────────────────────────────┴─────────────────┴───────────────────────────────────────────────────────────┘
```

- Opening a connection to Postgres is slow (network + login), so the pool keeps connections open and reuses them.
- 1 connection = 1 query at a time → the pool holds several (max 10 by default) so requests run in parallel.
- `pool.query(sql, params)` borrows a connection, runs the SQL, gives it back.

## Milestone 9: create the urls table with hand-written SQL

goal: create a urls table as designed in [here](DECISIONS.md#decision-04-design-the-urls-table-to-work-with-api-endpoints)

```sql
-- eg syntax
CREATE TABLE table_name (
  column_name type rules,
  column_name type rules
);
```

a schema is the shape of my data stored in the database. A database schema means, which tables exist, which columsn they have, and rules of each column. How are all these built or looked like.

=> For now, the `schema.sql` is run once, by hand with `psql`. I created the table, postgres saved to disk. It stays there permanently. Fastify `server` is just write SQL query to insert row or update row or delete row of that table

## Milestone 10: create-URL endpoint (`POST /api/urls`)

Part 1: happy path only (generate code -> INSERT -> 201), no validation yet

```ts
const { longUrl } = request.body as { longUrl: string }; // `as` = trust me, nothing is checked
const code = randomBytes(5).toString('base64url');      // 7 URL-safe chars
await pool.query('INSERT INTO urls (code, original_url) VALUES ($1, $2)', [code, longUrl]);
reply.code(201);                                         // without this Fastify sends 200
```

- `request.body`: the JSON the client sent, already parsed by Fastify (because `Content-Type: application/json`)
- `$1, $2`: filled from the array in order. values are sent separately from the SQL -> user input can't become SQL (no SQL injection)
- `randomBytes` (node:crypto) = unguessable. `Math.random()` is predictable, never use it for codes

Break it on purpose (curl POST with different bodies):

| body | status | what ended up in the db |
|---|---|---|
| `{"longUrl":"https://youtube.com"}` | 201 | `https://youtube.com` ✅ |
| `{"longUrl":"hello"}` | 201 | `hello` ❌ not a url, but stored |
| `{"longUrl":123}` | 201 | `123` ❌ a number, pg turned it into text |
| `{}` | 500 | nothing, NOT NULL in Postgres rejected it |

=> `as { longUrl: string }` protects nothing at runtime. Only the database rule (NOT NULL) caught 1 of 3 bad inputs, and it came back as a 500 (our fault) instead of 400 (client's fault)
=> the 500 response also leaks the raw database error (`null value in column "original_url"...`) to the client -> part 2 fixes all of this with validation

Bug I hit (Thunder Client): got 500 `null value in column "original_url"` -> my body used a different key than `longUrl`
- keys must match exactly (case-sensitive). a wrong key doesn't throw, `request.body.longUrl` is just `undefined` -> NULL -> Postgres rejects

JSON vs JS object:
- JSON (the text sent over HTTP): keys and strings MUST be in double quotes -> `{ "longUrl": "https://..." }`
- JS object (in my .ts code): quotes on keys optional -> `{ longUrl: 'https://...' }`
- JSON is strict so any language can parse it. Fastify runs `JSON.parse()` on the body, invalid JSON -> 400 before my handler runs. after parsing it's a normal JS object

Raw SQL pain points so far:
- `schema.sql` only creates from nothing, changing a live table is manual on every db (see [D05](DECISIONS.md#decision-05-raw-sql-first-drizzle-later))
- query results are `any`, and SQL strings aren't checked by TypeScript (typo in a column name = runtime error)

Part 2: validation (400 for bad input)

```ts
const { longUrl } = (request.body ?? {}) as { longUrl?: unknown }; // honest type: could be anything
if (typeof longUrl !== 'string' || !isWebUrl(longUrl)) {          // after this line TS knows it's a string
    reply.code(400);
    return { error: 'longUrl must be an http(s) URL' };
}
```

- `unknown` instead of `string`: TS forces me to check before using it. `as { longUrl: string }` was a lie, `unknown` is the truth
- `request.body ?? {}`: no body at all -> body is `undefined`, `?? {}` avoids the "cannot destructure" crash
- `isWebUrl`: `URL.parse(value)` returns `null` if it's not a URL at all, otherwise check `protocol` is `http:` or `https:` (allowlist)
- `typeof longUrl !== 'string'` -> TS narrows the type, so after the `if` it's a real `string` (no cast needed)

Same break-it tests again:

| body | before (part 1) | now |
|---|---|---|
| `{"longUrl":"https://youtube.com"}` | 201 | 201 |
| `{"longUrl":"hello"}` | 201, stored ❌ | 400 |
| `{"longUrl":123}` | 201, stored ❌ | 400 |
| `{}` / wrong key / `null` / no body | 500, leaked db error ❌ | 400 |
| `{"longUrl":"javascript:alert(1)"}` | 201, stored ❌ | 400 |
| `{"longUrl":"ftp://..."}` | 201, stored ❌ | 400 |
| `{longUrl:"x"}` (invalid JSON) | 400 from Fastify | 400 from Fastify (its own error format, before my handler) |

=> bad input never reaches the database anymore. every client mistake = 400 with a message that says what to fix
=> 2 layers now: my validation (first check) + Postgres NOT NULL / primary key (last check)

Part 3: collisions (retry when the code is already taken)

generate code -> INSERT -> success? return it
                        -> Postgres error `23505` (unique_violation, primary key taken)? -> new code, try again (max 3)
                        -> any other error (e.g. db down)? -> rethrow -> 500

- the database decides if a code is taken (primary key), not a "check then insert" in TS -> no race condition (D04)
- max 3 attempts: with ~1.1 trillion codes, 3 collisions in a row = a bug (e.g. generator broken), not bad luck -> stop instead of looping forever
- `(error as { code?: string }).code`: pg errors aren't typed, so I read Postgres's error code with a cast

How I tested a path that almost never runs (forced collision):
1. inserted a row with code `forced1` by hand
2. temporarily made `generateCode()` return `forced1` first -> POST still got 201 with a different code (retry worked)
3. made it always return `forced1` -> POST got 500 `could not generate a unique short code` (limit works, no infinite loop)
4. removed the temp code, deleted only my test rows

## Milestone 11: redirect endpoint (`GET /:code`)

```ts
app.get<{ Params: { code: string } }>('/:code', async (request, reply) => {
    const { code } = request.params;                         // "/a8K2x" -> code = "a8K2x"
    const result = await pool.query('SELECT original_url FROM urls WHERE code = $1', [code]);
    const originalUrl = result.rows[0]?.original_url;         // no row -> undefined
    if (!originalUrl) return reply.code(404).type('text/plain').send('Short link not found');
    return reply.redirect(originalUrl, 302);                  // 302 + Location header
})
```

- `:code` = route parameter, matches any single path segment, Fastify puts its value in `request.params.code`
- `app.get<{ Params: { code: string } }>`: tells TS the shape of `request.params` (a string from the URL path, always there if the route matched)
- `result.rows` = array of matching rows (`any`, pg isn't typed) -> 0 rows = code doesn't exist
- `reply.redirect(url, 302)` = `reply.code(302).header('Location', url)`, no body. the browser follows `Location` by itself
- `/health` still works: Fastify tries exact paths before `/:code`. (so a generated code `health` could never be reached, chance ~0)

Tested with curl:
- existing code -> `302` + `location: https://example.com/redirect-test`
- `curl -L` (follow like a browser) -> ends up at the original url
- unknown code -> `404`, `text/plain`, `Short link not found`

Raw SQL pain point: `result.rows[0]?.original_url` is `any` -> a typo like `.orginal_url` would just be `undefined` at runtime, no TS error -> every link would look "not found"

## Milestone 12: switch to Drizzle

New files:
- `src/schema.ts`: the urls table in TS (`code`, `originalUrl` -> column `original_url`)
- `drizzle.config.ts`: tells drizzle-kit where the schema is and where to write migrations
- `drizzle/0000_create_urls.sql` + `drizzle/meta/`: generated migration, committed to Git
- deleted `schema.sql` (the migration replaces it)

Commands:
- `npm run db:generate` -> compares `schema.ts` with the last snapshot, writes a new SQL file in `drizzle/`
- `npm run db:migrate` -> runs only the files this database hasn't run yet, records them in `drizzle.__drizzle_migrations`

Queries, before -> after:
```ts
pool.query('INSERT INTO urls (code, original_url) VALUES ($1, $2)', [code, longUrl])
db.insert(urls).values({ code, originalUrl: longUrl })

pool.query('SELECT original_url FROM urls WHERE code = $1', [code])      // rows: any
db.select({ originalUrl: urls.originalUrl }).from(urls).where(eq(urls.code, code))   // typed
```

Raw SQL pain points, checked:
- ✅ schema changes -> migrations
- ✅ results `any` -> typed
- ✅ column typos -> typecheck errors
- ❌ input validation -> still mine (Drizzle checks my code, not user data)
- ❌ error codes -> still a cast, and now nested in `error.cause` (the bug below)

Bug: after the switch, the forced collision returned 500 instead of retrying. Drizzle wraps pg's error, so `error.code` was `undefined` -> fix: `error.cause?.code`. Lesson: rewriting code can break a path that almost never runs, re-run the forced test after refactors.

## Milestone 13: connect React to the API

```tsx
const [longUrl, setLongUrl] = useState('')   // state = what React remembers; changing it re-renders
const response = await fetch('/api/urls', {  // the same POST as curl, sent by the browser
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ longUrl }),         // JS object -> JSON text
})
const data = await response.json()           // JSON text -> JS object
setShortUrl(data.shortUrl)                   // new state -> React shows the link
```

- `<form onSubmit>`: Enter key submits for free. `event.preventDefault()` stops the browser's default (reload the page)
- `<input type="url" required>`: the browser blocks empty / non-URL input before sending. UX only, the server still validates (anyone can skip the browser with curl)
- controlled input: `value={longUrl}` + `onChange` -> React state is always what's typed
- `{shortUrl && <p>...}`: render only when there's a result
- CORS: :5173 and :3000 are different origins -> Vite proxy forwards `/api` to :3000 (D11)

Full flow now:
```
type url → click Shorten → fetch POST /api/urls (:5173) → Vite proxy → Fastify (:3000) → Drizzle → Postgres
        ← React shows link ← setShortUrl ← 201 { shortUrl } ←──────────────────────────────────────┘
click the link → GET :3000/a8K2x → 302 → original page
```

## Milestone 14: loading and error states

Backend: one error handler for everything not handled in a route
```ts
app.setErrorHandler<FastifyError>((error, request, reply) => {
    if (error.statusCode && error.statusCode < 500) return reply.code(error.statusCode).send({ error: error.message });
    request.log.error(error);                                   // details -> log only
    return reply.code(500).send({ error: 'Something went wrong' }); // generic -> client
});
```

Frontend: 4 states (idle / loading / success / error)
```tsx
setLoading(true)
try {
  const response = await fetch(...)                 // throws if no response at all
  const data = await response.json()                // throws if body isn't JSON (proxy error page)
  if (response.ok) setShortUrl(data.shortUrl)      // 2xx
  else if (response.status < 500) setError(data.error)  // 4xx: server's reason
  else setError('Something went wrong, please try again') // 5xx
} catch { setError("Can't reach the server, please try again") }
finally { setLoading(false) }                       // always runs, success or failure
```

- `fetch` does NOT throw on 400/500, those are still responses -> check `response.ok` / `response.status`. it only throws when there's no response
- `<button disabled={loading}>`: no double click -> no duplicate links
- `<p role="alert">`: screen readers read the error out when it appears

Tested:
- `ftp://files.example.com` (passes the browser's URL check) -> 400 -> server's message
- database unreachable (scratch copy) -> `500 { "error": "Something went wrong" }`, full `ECONNREFUSED` only in the log
- backend down (proxy to a dead port) -> Vite proxy `502` with empty body -> `.json()` throws -> "Can't reach the server"

All errors and what the user sees: D12

## Milestone 15: test the complete app

Automated (API): `server/test/api.test.ts`, run with `npm test` while `npm run dev` is running
- `node:test` + `node:assert` are built into Node, no test framework installed
- real `fetch` calls to :3000 → checks status codes, bodies, the redirect `Location`
- `fetch(url, { redirect: 'manual' })`: don't follow the 302, so I can check it
- `after(...)`: delete only the rows the test created, then `db.$client.end()` closes the pool so the process exits
- result: 9/9 pass (health, create + follow, 6× 400, 404)

By hand (UI), in the browser at localhost:5173:
- [ ] valid URL → link appears → click it → original page opens
- [ ] `hello` → browser blocks it (no request, check DevTools → Network)
- [ ] `ftp://x.com` → "longUrl must be an http(s) URL"
- [ ] stop the backend (Ctrl+C) → "Can't reach the server, please try again"
- [ ] button shows "Shortening…" and is disabled while sending (DevTools → Network → Slow 3G to see it)
- [ ] open `localhost:3000/zzzzzzz` → "Short link not found"

## Milestone 16: deploy

What changed for production (details in D14):
- Fastify serves the built React app (`client/dist`) with `@fastify/static` → one server, one URL
- `PUBLIC_URL` / `PORT` / `HOST` come from env vars, local defaults stay the same
- `HOST=0.0.0.0` in production: `localhost` only accepts connections from the same machine, `0.0.0.0` accepts from outside (Render's router)
- favicon moved into `src/` so it's served from `/assets/`, not `/favicon.svg` (which `/:code` would catch)

Tested locally as "production": `npm run build` in client, then server with `PORT=3997 PUBLIC_URL=http://localhost:3997` → page, JS, favicon, `/health`, create, redirect, 404 all from one server

Build vs start (Render runs both):
- build (once per deploy): install packages, build React, `db:migrate` the Neon database
- start (keeps running): `node src/index.ts`
- `npm ci` instead of `npm install`: installs exactly what `package-lock.json` says, fails if it doesn't match
- `--include=dev`: Vite, TypeScript, drizzle-kit are devDependencies but the build needs them

Deployed: https://dan-shorten-url.onrender.com

Mistake I made: thought `PUBLIC_URL` chooses the app's address
- Render picks the address from the **service name at creation** (`url-shortener` was taken → `url-shortener-1f6b`). Renaming the service or changing env vars never changes it
- `PUBLIC_URL` only tells my code what the address already is, to build short links → it must copy Render's URL exactly, otherwise every short link points to an address with no app
- fix: new service with an unused name (`dan-shorten-url`), same Neon `DATABASE_URL` (links kept), `db:migrate` did nothing (already applied)

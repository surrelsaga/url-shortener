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


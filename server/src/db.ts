// The one place the server connects to Postgres. Other files import `pool` from here.
import pg from 'pg'

// Where the database is: postgres://user@host:port/database (read from .env)
const url = process.env.DATABASE_URL;

// No address = nothing can work, so crash now with a clear message
if (!url) throw new Error('DATABASE_URL is not set')

// A pool keeps a few connections open and reuses them.
// Usage anywhere: await pool.query('SELECT ...', [params])
export const pool = new pg.Pool({ connectionString: url })

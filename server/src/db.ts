// The one place the server connects to Postgres. Other files import `db` from here.
import { drizzle } from 'drizzle-orm/node-postgres';

// Where the database is: postgres://user@host:port/database (read from .env)
const url = process.env.DATABASE_URL;

// No address = nothing can work, so crash now with a clear message
if (!url) throw new Error('DATABASE_URL is not set')

// Drizzle on top of pg: still a pg connection pool underneath, but queries are written in TS.
// Usage anywhere: await db.select().from(urls)...
export const db = drizzle(url)

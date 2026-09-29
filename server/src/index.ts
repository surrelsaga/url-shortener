import Fastify from 'fastify';
import { randomBytes } from 'node:crypto';
import { pool } from './db.ts';

const app = Fastify({ logger: true });

app.get('/health', async () => {
    // SQL query string is added withing .query()
    await pool.query('select 1');
    return { status: "ok" };
})

// Only web links are allowed: blocks "hello", javascript:, ftp:, ... (allowlist, D03)
function isWebUrl(value: string) {
    const protocol = URL.parse(value)?.protocol; // URL.parse returns null if it's not a URL at all
    return protocol === 'http:' || protocol === 'https:';
}

// 5 random bytes -> 7 URL-safe chars (A-Z a-z 0-9 - _), unguessable (D06)
function generateCode() {
    return randomBytes(5).toString('base64url');
}

// Insert with a random code. If Postgres says the code already exists, try a new one (D04).
async function insertWithUniqueCode(longUrl: string) {
    for (let attempt = 1; attempt <= 3; attempt++) {
        const code = generateCode();
        try {
            // $1, $2 are filled from the array, so user input never becomes SQL
            await pool.query('INSERT INTO urls (code, original_url) VALUES ($1, $2)', [code, longUrl]);
            return code;
        } catch (error) {
            // 23505 = unique_violation (primary key taken). Anything else is a real failure -> rethrow (500)
            if ((error as { code?: string }).code !== '23505') throw error;
            app.log.warn({ code, attempt }, 'short code collision, retrying');
        }
    }
    // 3 collisions in a row with ~1.1 trillion codes = something is broken, not bad luck
    throw new Error('could not generate a unique short code');
}

// Create a short URL: { longUrl } -> 201 { shortUrl } | 400 { error }
app.post('/api/urls', async (request, reply) => {
    // body comes from the client = untrusted, so treat longUrl as `unknown` until checked
    const { longUrl } = (request.body ?? {}) as { longUrl?: unknown };
    if (typeof longUrl !== 'string' || !isWebUrl(longUrl)) {
        reply.code(400);
        return { error: 'longUrl must be an http(s) URL' };
    }

    const code = await insertWithUniqueCode(longUrl);

    reply.code(201);
    return { shortUrl: `http://localhost:3000/${code}` }; // ponytail: hardcoded host, move to env var at deploy
})

await app.listen({ port: 3000 });

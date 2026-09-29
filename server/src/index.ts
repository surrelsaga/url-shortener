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

// Create a short URL: { longUrl } -> 201 { shortUrl } | 400 { error }
app.post('/api/urls', async (request, reply) => {
    // body comes from the client = untrusted, so treat longUrl as `unknown` until checked
    const { longUrl } = (request.body ?? {}) as { longUrl?: unknown };
    if (typeof longUrl !== 'string' || !isWebUrl(longUrl)) {
        reply.code(400);
        return { error: 'longUrl must be an http(s) URL' };
    }

    // 5 random bytes -> 7 URL-safe chars (A-Z a-z 0-9 - _), unguessable
    const code = randomBytes(5).toString('base64url');

    // $1, $2 are filled from the array, so user input never becomes SQL
    await pool.query('INSERT INTO urls (code, original_url) VALUES ($1, $2)', [code, longUrl]);

    reply.code(201);
    return { shortUrl: `http://localhost:3000/${code}` }; // ponytail: hardcoded host, move to env var at deploy
})

await app.listen({ port: 3000 });

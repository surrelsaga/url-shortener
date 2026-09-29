import Fastify from 'fastify';
import { randomBytes } from 'node:crypto';
import { pool } from './db.ts';

const app = Fastify({ logger: true });

app.get('/health', async () => {
    // SQL query string is added withing .query()
    await pool.query('select 1');
    return { status: "ok" };
})

// Create a short URL: { longUrl } -> 201 { shortUrl }
app.post('/api/urls', async (request, reply) => {
    const { longUrl } = request.body as { longUrl: string }; // ponytail: unchecked input, validated in part 2
    // 5 random bytes -> 7 URL-safe chars (A-Z a-z 0-9 - _), unguessable
    const code = randomBytes(5).toString('base64url');

    // $1, $2 are filled from the array, so user input never becomes SQL
    await pool.query('INSERT INTO urls (code, original_url) VALUES ($1, $2)', [code, longUrl]);

    reply.code(201);
    return { shortUrl: `http://localhost:3000/${code}` }; // ponytail: hardcoded host, move to env var at deploy
})

await app.listen({ port: 3000 });

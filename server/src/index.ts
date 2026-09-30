import Fastify, { type FastifyError } from 'fastify';
import { randomBytes } from 'node:crypto';
import { eq, sql } from 'drizzle-orm';
import { db } from './db.ts';
import { urls } from './schema.ts';

const app = Fastify({ logger: true });

// Every error not handled inside a route ends up here (D12)
app.setErrorHandler<FastifyError>((error, request, reply) => {
    // Fastify's own client errors (e.g. invalid JSON = 400): keep the status, use our { error } shape
    if (error.statusCode && error.statusCode < 500) {
        return reply.code(error.statusCode).send({ error: error.message });
    }
    // our fault (bug, database down, 3 collisions): full details in the log, generic message to the client
    request.log.error(error);
    return reply.code(500).send({ error: 'Something went wrong' });
});

app.get('/health', async () => {
    // raw SQL still possible when needed, via the sql`` tag
    await db.execute(sql`select 1`);
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
            // Drizzle builds: INSERT INTO urls (code, original_url) VALUES ($1, $2) -> still parameters, no SQL injection
            // column names are checked by TS: a typo like `orignalUrl` fails typecheck
            await db.insert(urls).values({ code, originalUrl: longUrl });
            return code;
        } catch (error) {
            // 23505 = unique_violation (primary key taken). Anything else is a real failure -> rethrow (500)
            // Drizzle wraps pg's error, the Postgres error code is on `error.cause` (D10)
            if ((error as { cause?: { code?: string } }).cause?.code !== '23505') throw error;
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

// Follow a short URL: GET /:code -> 302 to the original url | 404 (D03)
// Registered after /health: Fastify tries exact paths first, so /health never reaches here
app.get<{ Params: { code: string } }>('/:code', async (request, reply) => {
    const { code } = request.params; // the part after "/", e.g. "a8K2x"

    // Drizzle builds: SELECT original_url FROM urls WHERE code = $1
    // `row` is typed { originalUrl: string } | undefined, not `any` like with raw pg
    const [row] = await db.select({ originalUrl: urls.originalUrl }).from(urls).where(eq(urls.code, code));
    const originalUrl = row?.originalUrl; // no row -> undefined

    if (!originalUrl) {
        // a person sees this in the browser, so plain text instead of JSON (D09)
        return reply.code(404).type('text/plain').send('Short link not found');
    }

    // 302 + Location header, the browser goes there by itself (302 not 301: see D03)
    return reply.redirect(originalUrl, 302);
})

await app.listen({ port: 3000 });

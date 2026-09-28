import Fastify from 'fastify';
import { pool } from './db.ts';

const app = Fastify({ logger: true });

app.get('/health', async () => {
    // SQL query string is added withing .query()
    await pool.query('select 1');
    return { status: "ok" };
})

await app.listen({ port: 3000 });

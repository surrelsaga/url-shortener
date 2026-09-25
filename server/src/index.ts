import Fastify from 'fastify';

const app = Fastify({ logger: true });

await app.listen({ port: 3000 });

// The urls table from D04, written in TypeScript. Drizzle reads this to:
// 1. type-check queries (column names, result types)
// 2. generate migrations (npm run db:generate)
import { pgTable, text } from 'drizzle-orm/pg-core';

export const urls = pgTable('urls', {
    code: text('code').primaryKey(),
    originalUrl: text('original_url').notNull(), // TS name: originalUrl, column in Postgres: original_url
});

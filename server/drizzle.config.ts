// Config for drizzle-kit (the CLI that generates and runs migrations)
import { existsSync } from 'node:fs';
import { defineConfig } from 'drizzle-kit';

// locally: load .env. On Render there's no .env, DATABASE_URL comes from the dashboard
if (existsSync('.env')) process.loadEnvFile('.env');

export default defineConfig({
    dialect: 'postgresql',
    schema: './src/schema.ts', // where my tables are defined
    out: './drizzle', // where migration SQL files are written (committed to Git)
    dbCredentials: { url: process.env.DATABASE_URL! }, // ponytail: `!` ok, drizzle-kit fails with a clear error if it's missing
});

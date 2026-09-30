// Config for drizzle-kit (the CLI that generates and runs migrations)
import { defineConfig } from 'drizzle-kit';

process.loadEnvFile('.env'); // built into Node: puts DATABASE_URL into process.env

export default defineConfig({
    dialect: 'postgresql',
    schema: './src/schema.ts', // where my tables are defined
    out: './drizzle', // where migration SQL files are written (committed to Git)
    dbCredentials: { url: process.env.DATABASE_URL! }, // ponytail: `!` ok here, loadEnvFile above throws if .env is missing
});

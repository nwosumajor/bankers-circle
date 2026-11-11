import { existsSync } from 'node:fs';
import { defineConfig } from 'prisma/config';

// Prisma 7 no longer loads .env itself.
if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  // The CLI (migrate, introspect) uses the direct connection, never the Supavisor pooler (CLAUDE.md §3.1).
  // Optional so `prisma generate` works without a database.
  datasource: { url: process.env['DIRECT_URL'] },
});

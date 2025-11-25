// prisma.config.ts
import 'dotenv/config';
import path from 'node:path';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  // location of your schema file
  schema: path.join('prisma', 'schema.prisma'),

  // migrations folder
  migrations: {
    path: path.join('prisma', 'migrations'),
  },

  // This is where you configure the connection URL used by CLI commands
  // Keep this pointing to your env var
  datasource: {
    url: env('DATABASE_URL'),
  },

  // Optional: engine selection (usually not needed; rely on defaults)
  // engine: 'classic' // do NOT change unless you know what you're doing
});

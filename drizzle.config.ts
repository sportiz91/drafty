import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/database/schema',
  out: './src/database/migrations',
  dbCredentials: {
    url: process.env.DATABASE_PATH ?? './data/drafty.db',
  },
});

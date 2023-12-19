import { defineConfig } from 'drizzle-kit'
export default defineConfig({
  schema: './src/db/schema.ts',
  driver: 'mysql2',
  dbCredentials: {
    user: process.env.DATABASE_USERNAME,
    database: 'lingo',
    password: process.env.DATABASE_PASSWORD,
    host: process.env.DATABASE_HOST ?? 'localhost',
  },
  out: './db-out',
  verbose: true,
  strict: true,
})

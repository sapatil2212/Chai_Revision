// Server-side database client. Import only from server code
// (route handlers, server actions, scripts) — never from 'use client' files.
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

function createPool() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set. Add it to .env');
  }
  return mysql.createPool({
    uri: url,
    connectionLimit: 10,
    waitForConnections: true,
    charset: 'utf8mb4', // required for Devanagari text
    timezone: 'Z',
  });
}

// Reuse one pool across Next.js hot reloads in development
const globalForDb = globalThis as unknown as { __chaiDbPool?: mysql.Pool };
const pool = globalForDb.__chaiDbPool ?? createPool();
if (process.env.NODE_ENV !== 'production') globalForDb.__chaiDbPool = pool;

export const db = drizzle(pool, { schema, mode: 'default' });
export { schema };

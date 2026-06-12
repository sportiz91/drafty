import fs from 'fs';
import path from 'path';

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import { refreshTokens } from '@/database/schema/refresh-tokens-schema';
import { users } from '@/database/schema/users-schema';
import { serverConfig } from '@/lib/config/config';

// Reuse the connection across Next.js dev-server hot reloads.
const globalForDb = globalThis as unknown as { sqlite?: Database.Database };

function createConnection(): Database.Database {
  fs.mkdirSync(path.dirname(serverConfig.databasePath), { recursive: true });

  const connection = new Database(serverConfig.databasePath);
  connection.pragma('journal_mode = WAL');
  connection.pragma('foreign_keys = ON');

  return connection;
}

const sqlite = globalForDb.sqlite ?? createConnection();

if (serverConfig.nodeEnv !== 'production') {
  globalForDb.sqlite = sqlite;
}

export const db = drizzle(sqlite, { schema: { users, refreshTokens } });

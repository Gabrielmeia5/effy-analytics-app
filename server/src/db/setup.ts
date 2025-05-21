import { pool } from './pgClient';

export async function setupDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS metric (
    "id" SERIAL PRIMARY KEY,
    "temperature" FLOAT NOT NULL,
    "efficiency" FLOAT NOT NULL,
    "location" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

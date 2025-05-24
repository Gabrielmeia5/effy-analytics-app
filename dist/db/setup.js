"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupDatabase = setupDatabase;
const pgClient_1 = require("./pgClient");
async function setupDatabase() {
    await pgClient_1.pool.query(`
    CREATE TABLE IF NOT EXISTS metric (
    "id" SERIAL PRIMARY KEY,
    "temperature" FLOAT NOT NULL,
    "efficiency" FLOAT NOT NULL,
    "location" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

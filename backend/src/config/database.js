import mysql from 'mysql2/promise';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { backendRoot } from './env.js';

export function databaseOptions(withDatabase = true) {
  for (const key of ['TIDB_HOST', 'TIDB_USER', 'TIDB_PASSWORD', 'TIDB_DATABASE']) {
    if (!process.env[key]) throw new Error(`Falta ${key} en backend/.env.`);
  }
  if (!/^[a-zA-Z0-9_]{1,64}$/.test(process.env.TIDB_DATABASE)) {
    throw new Error('TIDB_DATABASE debe contener solo letras, números y guion bajo (máximo 64).');
  }
  return {
    host: process.env.TIDB_HOST,
    port: Number(process.env.TIDB_PORT || 4000),
    user: process.env.TIDB_USER,
    password: process.env.TIDB_PASSWORD,
    ...(withDatabase ? { database: process.env.TIDB_DATABASE } : {}),
    ssl: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true,
      ...(process.env.TIDB_CA_PATH
        ? { ca: readFileSync(path.resolve(backendRoot, process.env.TIDB_CA_PATH)) }
        : {}),
    },
    waitForConnections: true,
    connectionLimit: 5,
    connectTimeout: 15000,
    timezone: 'Z',
    decimalNumbers: true,
  };
}

export function createPool() {
  return mysql.createPool(databaseOptions());
}

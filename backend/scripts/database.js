import mysql from 'mysql2/promise';
import { readFile } from 'node:fs/promises';
import { databaseOptions } from '../src/config/database.js';

let connection;
try {
  const action = process.argv[2];
  if (!['check', 'init'].includes(action)) throw new Error('Usa check o init.');
  const { connectionLimit, waitForConnections, ...options } = databaseOptions(action === 'check');
  connection = await mysql.createConnection(options);
  if (action === 'init') {
    const database = process.env.TIDB_DATABASE;
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    await connection.query(`USE \`${database}\``);
    const schema = await readFile(new URL('../sql/schema.sql', import.meta.url), 'utf8');
    for (const statement of schema
      .split(';')
      .map((value) => value.trim())
      .filter(Boolean))
      await connection.query(statement);
    console.log('Base de datos y tablas listas. No se eliminaron datos existentes.');
  } else {
    const [rows] = await connection.query(
      'SELECT VERSION() AS version, DATABASE() AS base_de_datos',
    );
    console.table(rows);
    console.log('Conexión TLS con TiDB verificada.');
  }
} catch (error) {
  console.error('Error de base de datos:', error.code || error.message);
  process.exitCode = 1;
} finally {
  if (connection) await connection.end();
}

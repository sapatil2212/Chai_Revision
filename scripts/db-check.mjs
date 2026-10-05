// Quick connectivity check for the MySQL database configured in .env
// Usage: node --env-file=.env scripts/db-check.mjs
import mysql from 'mysql2/promise';

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

try {
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: Number(DB_PORT || 3306),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    connectTimeout: 15000,
  });

  const [[info]] = await conn.query(
    'SELECT VERSION() AS version, DATABASE() AS db, CURRENT_USER() AS user'
  );
  const [tables] = await conn.query('SHOW TABLES');
  const [grants] = await conn.query('SHOW GRANTS FOR CURRENT_USER()');

  console.log('Connected: OK');
  console.log('Server version:', info.version);
  console.log('Database:', info.db);
  console.log('Authenticated as:', info.user);
  console.log('Tables:', tables.length ? tables.map((t) => Object.values(t)[0]).join(', ') : '(none)');
  console.log('Grants:');
  for (const g of grants) console.log('  ', Object.values(g)[0]);

  await conn.end();
} catch (err) {
  console.error('Connection FAILED:', err.code || '', err.message);
  process.exit(1);
}

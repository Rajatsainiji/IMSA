/**
 * Database creation script
 * Run this ONCE before starting the server for the first time:
 *   node scripts/createDb.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

const {
  DB_HOST = 'localhost',
  DB_PORT = 3306,
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_NAME = 'inventory_db'
} = process.env;

async function createDatabase() {
  let connection;
  try {
    console.log(`Connecting to MySQL at ${DB_HOST}:${DB_PORT} as '${DB_USER}'...`);

    // Connect WITHOUT specifying a database
    connection = await mysql.createConnection({
      host: DB_HOST,
      port: parseInt(DB_PORT),
      user: DB_USER,
      password: DB_PASSWORD
    });

    console.log('✅ MySQL connection successful');

    // Create database if it doesn't exist
    await connection.execute(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log(`✅ Database '${DB_NAME}' created (or already exists)`);

    await connection.end();
    console.log('\n✅ Done! Now run migrations:');
    console.log('   npx sequelize-cli db:migrate');
    console.log('   npx sequelize-cli db:seed:all');
    console.log('\nThen start the server:');
    console.log('   npm run dev');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Failed to create database:', err.message);

    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\nAccess denied. Check your DB_USER and DB_PASSWORD in .env');
    } else if (err.code === 'ECONNREFUSED') {
      console.error('\nMySQL is not running. Start MySQL and try again.');
    }

    if (connection) await connection.end().catch(() => {});
    process.exit(1);
  }
}

createDatabase();

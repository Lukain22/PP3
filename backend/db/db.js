const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error conectando a MySQL:', err.code);
  } else {
    console.log('MySQL conectado');
    connection.release();
  }
});

module.exports = pool;
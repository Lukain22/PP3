const mysql = require('mysql2');
require('dotenv').config();

const password = process.env.DB_PASSWORD && process.env.DB_PASSWORD.length > 0 ? process.env.DB_PASSWORD : undefined;

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306
});

connection.ready = new Promise((resolve, reject) => {
  connection.connect((err) => {
    if (err) {
      console.log('Error DB:', err);
      reject(err);
      return;
    }

    console.log('MySQL conectado');

    connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
      (createErr) => {
        if (createErr) {
          console.log('Error creando la base de datos:', createErr);
          reject(createErr);
          return;
        }

        connection.changeUser({ database: process.env.DB_NAME }, (changeErr) => {
          if (changeErr) {
            console.log('Error seleccionando la base de datos:', changeErr);
            reject(changeErr);
            return;
          }

          console.log(`Base de datos ${process.env.DB_NAME} lista`);
          resolve(connection);
        });
      }
    );
  });
});

module.exports = connection;

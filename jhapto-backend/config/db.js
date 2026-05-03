// config/db.js
// Connects Node.js to your MySQL jhapto database

const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host     : process.env.DB_HOST,
  user     : process.env.DB_USER,
  password : "Vedshasha1!",   // ← comes from .env file
  database : process.env.DB_NAME,
  port     : process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit   : 10,
});

// Test the connection on startup
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ Connected to MySQL database: jhapto');
    connection.release();
  }
});

module.exports = pool.promise();  // use promise-based queries

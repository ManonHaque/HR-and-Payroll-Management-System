const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection pool to the MySQL database
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Helper function to test the database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Successfully connected to the MySQL Database.');
    connection.release();
  } catch (error) {
    console.error('❌ Failed to connect to the MySQL Database:');
    console.error(error.message);
    process.exit(1); // Exit process if DB connection fails
  }
};

module.exports = {
  pool,
  testConnection
};


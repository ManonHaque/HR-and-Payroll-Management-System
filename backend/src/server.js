require('dotenv').config();
const app = require('./app');
const { testConnection } = require('./config/db');

const PORT = process.env.PORT || 5000;

// Initialize server and database connection
const startServer = async () => {
  // 1. Verify database connection
  await testConnection();

  // 2. Start listening for incoming requests
  app.listen(PORT, () => {
    console.log(`🚀 Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log(`🩺 Health check available at: http://localhost:${PORT}/api/health`);
  });
};

startServer();
// Load environment variables from a .env file into process.env
require('dotenv').config();

// Import Sequelize ORM
const { Sequelize } = require('sequelize');

// Create a new Sequelize instance using MySQL connection details from environment variables
const sequelize = new Sequelize(
  process.env.MYSQL_ADDON_DB,        // Database name
  process.env.MYSQL_ADDON_USER,      // Database username
  process.env.MYSQL_ADDON_PASSWORD,  // Database password
  {
    host: process.env.MYSQL_ADDON_HOST, // Host address of the MySQL server
    dialect: 'mysql',                   // Specify SQL dialect (MySQL)
    port: 3306,                         // MySQL default port
    dialectOptions: {
      ssl: {
        rejectUnauthorized: false       // Allow self-signed certificates (useful in some hosted environments)
      }
    }
  }
);

// ✅ Export the Sequelize instance so it can be imported elsewhere in your project
module.exports = { sequelize };

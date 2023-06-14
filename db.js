const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  "locallibrary",
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: "localhost",
    dialect: "postgres",
    define: {
      freezeTableName: true,
    },
  }
);

module.exports = sequelize;

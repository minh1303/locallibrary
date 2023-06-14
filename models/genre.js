const { DataTypes } = require("sequelize");
const Book = require("./book");

const sequelize = require("../db");

const Genre = sequelize.define(
  "genre",
  {
    name: { type: DataTypes.STRING(100), allowNull: false },
    url: {
      type: DataTypes.VIRTUAL,
      get() {
        return `/catalog/genre/${this.id}`;
      },
    },
  },
  { tableName: "genre" }
);

module.exports = Genre;

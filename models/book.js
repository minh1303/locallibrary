const Author = require("./author");

const { DataTypes, UUID, UUIDV4 } = require("sequelize");

const sequelize = require("../db");
const Genre = require("./genre");

const Book = sequelize.define("book", {
  id: {
    type: DataTypes.UUID,
    defaultValue: UUIDV4,
    primaryKey: true,
  },
  title: { type: DataTypes.TEXT, allowNull: false },
  summary: { type: DataTypes.TEXT, allowNull: false },
  isbn: { type: DataTypes.TEXT, allowNull: false },
  url: {
    type: DataTypes.VIRTUAL,
    get() {
      return `/catalog/book/${this.id}`;
    },
  },
});

Author.hasMany(Book);
Book.belongsTo(Author);
Book.belongsToMany(Genre, { through: "BookGenres" });
Genre.belongsToMany(Book, { through: "BookGenres" });

module.exports = Book;

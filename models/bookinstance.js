const Book = require("./book");

const { DataTypes } = require("sequelize");
const { DateTime } = require("luxon");

const sequelize = require("../db");

const BookInstance = sequelize.define("bookinstance", {
  imprint: { type: DataTypes.TEXT, allowNull: false },
  status: {
    type: DataTypes.ENUM,
    values: ["Available", "Maintenance", "Loaned", "Reserved"],
    allowNull: false,
    defaultValue: "Maintenance",
  },

  due_back: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  due_back_formatted: {
    type: DataTypes.VIRTUAL,
    get() {
      return DateTime.fromJSDate(this.due_back).toLocaleString(
        DateTime.DATE_MED
      );
    },
  },

  due_back_form_formatted: {
    type: DataTypes.VIRTUAL,
    get() {
      return DateTime.fromJSDate(this.due_back).toFormat("yyyy-MM-dd")

    },
  },

  url: {
    type: DataTypes.VIRTUAL,
    get() {
      return `/catalog/bookinstance/${this.id}`;
    },
  },
});

Book.hasMany(BookInstance);
BookInstance.Book = BookInstance.belongsTo(Book);

module.exports = BookInstance;

const { DataTypes } = require("sequelize");
const { DateTime } = require("luxon");

const sequelize = require("../db");
const Author = sequelize.define(
  "author",
  {
    first_name: { type: DataTypes.STRING(100), allowNull: false },
    family_name: { type: DataTypes.STRING(100), allowNull: false },
    date_of_birth: { type: DataTypes.DATE },
    date_of_death: { type: DataTypes.DATE },
    lifespan: {
      type: DataTypes.VIRTUAL,
      get() {
        const date_of_birth_formatted = DateTime.fromJSDate(
          this.date_of_birth
        ).toLocaleString(DateTime.DATE_MED);

        const date_of_death_formatted = DateTime.fromJSDate(
          this.date_of_death
        ).toLocaleString(DateTime.DATE_MED);

        return `${date_of_birth_formatted} - ${
          this.date_of_death ? date_of_death_formatted : ""
        }`;
      },
    },
    date_of_birth_formatted: {
      type: DataTypes.VIRTUAL,
      get() {
        return `${DateTime.fromJSDate(this.date_of_birth).toFormat("yyyy-MM-dd")}`
      },
    },
    date_of_death_formatted: {
      type: DataTypes.VIRTUAL,
      get() {
        return DateTime.fromJSDate(this.date_of_death).toFormat("yyyy-MM-dd")
      },
    },

    full_name: {
      type: DataTypes.VIRTUAL,
      get() {
        return `${this.first_name} ${this.family_name}`;
      },
      set(value) {
        throw new Error("Do not try to set the `fullName` value!");
      },
    },

    url: {
      type: DataTypes.VIRTUAL,
      get() {
        return `/catalog/author/${this.id}`;
      },
    },
  },
  { tableName: "author" }
);

module.exports = Author;

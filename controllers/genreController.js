const Genre = require("../models/genre");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

// Display list of all Genre.
exports.genre_list = asyncHandler(async (req, res, next) => {
  const allGenres = await Genre.findAll({});
  res.render("genre_list", { title: "Genre List", genre_list: allGenres });
});

// Display detail page for a specific Genre.
exports.genre_detail = asyncHandler(async (req, res, next) => {
  const genre = await Genre.findByPk(req.params.id);
  const booksInGenre = await genre.getBooks();
  if (genre === null) {
    // No results.
    const err = new Error("Genre not found");
    err.status = 404;
    return next(err);
  }

  res.render("genre_detail", {
    title: "Genre Detail",
    genre: genre,
    genre_books: booksInGenre,
  });
});

// Display Genre create form on GET.
exports.genre_create_get = (req, res, next) => {
  res.render("genre_form", { title: "Create Genre" });
};

// Handle Genre create on POST.
exports.genre_create_post = [
  body("name", "Genre name must contain at least 3 characters")
    .trim()
    .isLength({ min: 3 })
    .escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    const genre = await Genre.build({ name: req.body.name });
    if (!errors.isEmpty()) {
      return res.render("genre_form", {
        title: "Create Genre",
        genre,
        errors: errors.array(),
      });
    } else {
      const genreExists = await Genre.findOne({
        where: {
          name: req.body.name,
        },
      });

      if (genreExists) res.redirect(genreExists.url);
      else {
        await genre.save();
        res.redirect(genre.url);
      }
    }
  }),
];

// Display Genre delete form on GET.
exports.genre_delete_get = asyncHandler(async (req, res, next) => {
  // Get books of genres
  const genre = await Genre.findByPk(req.params.id);
  const allBooksFromGenres = await genre.getBooks();
  if (genre === null) {
    // No results.
    res.redirect("/catalog/genres");
  }

  res.render("genre_delete", {
    title: "Delete genre",
    genre: genre,
    genre_books: allBooksFromGenres,
  });
});

// Handle Genre delete on POST.
exports.genre_delete_post = asyncHandler(async (req, res, next) => {
  const genre = await Genre.findByPk(req.params.id);
  const allBooksFromGenres = await genre.getBooks();
  if (allBooksFromGenres.length > 0) {
    // Author has books. Render in same way as for GET route.
    res.render("genre_delete", {
      title: "Delete genre",
      genre: genre,
      genre_books: allBooksFromGenres,
    });
    return;
  } else {
    // Author has no books. Delete object and redirect to the list of authors.
    await Genre.destroy({
      where: {
        id: req.body.genreid,
      },
    });
    res.redirect("/catalog/genres");
  }
});

// Display Genre update form on GET.
exports.genre_update_get = asyncHandler(async (req, res, next) => {
  // Get book, authors and genres for form.
  const genre = await Genre.findByPk(req.params.id);

  res.render("genre_form", {
    title: "Update Genre",
    genre,
  });
});

// Handle Genre update on POST.
exports.genre_update_post = [
  body("name", "Name must not be empty.").trim().isLength({ min: 1 }).escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    const genre = await Genre.findByPk(req.params.id);

    if (!errors.isEmpty()) {
      return res.render("book_form", {
        title: "Update genre",
        genre,
        errors: errors.array()
      });
    } else {
      await genre.update({ name: req.body.name });
      res.redirect(genre.url);
    }
  }),
];

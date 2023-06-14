const Book = require("../models/book");
const Author = require("../models/author");
const Genre = require("../models/genre");
const BookInstance = require("../models/bookinstance");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const { where } = require("sequelize");

exports.index = asyncHandler(async (req, res, next) => {
  const [
    numBooks,
    numBookInstances,
    numAvailableBookInstances,
    numAuthors,
    numGenres,
  ] = await Promise.all([
    Book.count({}),
    BookInstance.count(),
    BookInstance.count({ where: { status: "Available" } }), //countDocuments({ status: "Available" }).exec(),
    Author.count(),
    Genre.count(),
  ]);

  res.render("index", {
    title: "Local Library Home",
    book_count: numBooks,
    book_instance_count: numBookInstances,
    book_instance_available_count: numAvailableBookInstances,
    author_count: numAuthors,
    genre_count: numGenres,
  });
});

// Display list of all books.
exports.book_list = asyncHandler(async (req, res, next) => {
  const allBooks = await Book.findAll({
    attributes: ["title", "authorId", "id"],
    order: [["title", "ASC"]],
    include: Author,
  });
  console.log(allBooks[0]);
  res.render("book_list", { title: "Book List", book_list: allBooks });
});

// Display detail page for a specific book.
exports.book_detail = asyncHandler(async (req, res, next) => {
  const findBook = await Book.findByPk(req.params.id, { include: Author });
  const genre = await findBook.getGenres();
  const book = {
    id: findBook.id,
    url: findBook.url,
    author: findBook.author,
    title: findBook.title,
    summary: findBook.summary,
    isbn: findBook.isbn,
    genre,
  };
  const bookInstances = await findBook.getBookinstances();

  if (book === null) {
    // No results.
    const err = new Error("Book not found");
    err.status = 404;
    return next(err);
  }

  res.render("book_detail", {
    title: book.title,
    book: book,
    book_instances: bookInstances,
  });
});

// Display book create form on GET.
exports.book_create_get = asyncHandler(async (req, res, next) => {
  const [allAuthors, allGenres] = await Promise.all([
    Author.findAll(),
    Genre.findAll(),
  ]);

  res.render("book_form", {
    title: "Create Book",
    authors: allAuthors,
    genres: allGenres,
  });
});

// Handle book create on POST.
exports.book_create_post = [
  (req, res, next) => {
    if (!(req.body.genre instanceof Array)) {
      if (typeof req.body.genre === "undefined") req.body.genre = [];
      else req.body.genre = new Array(req.body.genre);
    }
    next();
  },
  // Validate and sanitize fields.
  body("title", "Title must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("author", "Author must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("summary", "Summary must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("isbn", "ISBN must not be empty").trim().isLength({ min: 1 }).escape(),
  body("genre.*").escape(),
  // Process request after validation and sanitization.,
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    const { title, author, summary, isbn, genre } = req.body;
    const book = { title, summary, isbn, genre };

    if (!errors.isEmpty()) {
      const [allAuthors, allGenres] = await Promise.all([
        Author.findAll(),
        Genre.findAll(),
      ]);

      // Mark our selected genres as checked.
      for (const genre of allGenres) {
        if (book.genre.indexOf(genre._id) > -1) {
          genre.checked = "true";
        }
      }
      res.render("book_form", {
        title: "Create Book",
        authors: allAuthors,
        genres: allGenres,
        book: book,
        errors: errors.array(),
      });
    } else {
      // Data from form is valid. Save book.
      const book = await Book.create({ title, summary, isbn, genre });
      await book.setAuthor(author);
      res.redirect(book.url);
    }
  }),
];

// Display book delete form on GET.
exports.book_delete_get = asyncHandler(async (req, res, next) => {
  // Get details of book and all their book instances
  const book = await Book.findByPk(req.params.id);
  const allBookinstancesFromBook = await book.getBookinstances();
  if (book === null) {
    // No results.
    res.redirect("/catalog/books");
  }

  res.render("book_delete", {
    title: "Delete Book",
    book: book,
    book_instances: allBookinstancesFromBook,
  });
});

// Handle book delete on POST.
exports.book_delete_post = asyncHandler(async (req, res, next) => {
  // Get details of author and all their books (in parallel)

  const book = await Book.findByPk(req.params.id);
  const allBookinstancesFromBook = await book.getBookinstances();

  if (allBookinstancesFromBook.length > 0) {
    // Author has books. Render in same way as for GET route.
    res.render("book_delete", {
      title: "Delete Book",
      book: book,
      book_instances: allBookinstancesFromBook,
    });
    return;
  } else {
    // Author has no books. Delete object and redirect to the list of authors.
    await Book.destroy({
      where: {
        id: req.body.bookid,
      },
    });
    res.redirect("/catalog/books");
  }
});

// Display book update form on GET.
// Display book update form on GET.
exports.book_update_get = asyncHandler(async (req, res, next) => {
  // Get book, authors and genres for form.
  const [book, allAuthors, allGenres] = await Promise.all([
    Book.findByPk(req.params.id, { include: Author }),
    Author.findAll(),
    Genre.findAll(),
  ]);
  if (book === null) {
    // No results.
    const err = new Error("Book not found");
    err.status = 404;
    return next(err);
  }
  const bookgenres = await book.getGenres();
  // Mark our selected genres as checked.
  for (const genre of allGenres) {
    for (const book_g of bookgenres) {
      if (genre.id.toString() === book_g.id.toString()) {
        genre.checked = "true";
      }
    }
  }

  res.render("book_form", {
    title: "Update Book",
    authors: allAuthors,
    genres: allGenres,
    book: book,
  });
});

// Handle book update on POST.
// Handle book update on POST.
exports.book_update_post = [
  // Convert the genre to an array.
  (req, res, next) => {
    if (!(req.body.genre instanceof Array)) {
      if (typeof req.body.genre === "undefined") {
        req.body.genre = [];
      } else {
        req.body.genre = new Array(req.body.genre);
      }
    }
    next();
  },

  // Validate and sanitize fields.
  body("title", "Title must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("author", "Author must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("summary", "Summary must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("isbn", "ISBN must not be empty").trim().isLength({ min: 1 }).escape(),
  body("genre.*").escape(),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);
    // Create a Book object with escaped/trimmed data and old id.
    const book = {
      title: req.body.title,
      summary: req.body.summary,
      isbn: req.body.isbn,
    };

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.

      // Get all authors and genres for form
      const [allAuthors, allGenres] = await Promise.all([
        Author.findAll(),
        Genre.findAll(),
      ]);

      // Mark our selected genres as checked.
      for (const genre of allGenres) {
        if (book.genre.indexOf(genres._id) > -1) {
          genre.checked = "true";
        }
      }
      res.render("book_form", {
        title: "Update Book",
        authors: allAuthors,
        genres: allGenres,
        book: book,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid. Update the record.
      const thebook = await Book.findByPk(req.params.id);
      await thebook.setAuthor(req.body.author);
      await thebook.setGenres(req.body.genre);
      await thebook.update(book);
      // Redirect to book detail page.
      res.redirect(thebook.url);
    }
  }),
];

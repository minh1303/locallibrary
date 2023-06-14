const Author = require("../models/author");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const Book = require("../models/book");

// Display list of all Authors.
exports.author_list = asyncHandler(async (req, res, next) => {
  const allAuthors = await Author.findAll();
  res.render("author_list", {
    title: "Author List",
    author_list: allAuthors,
  });
});

// Display detail page for a specific Author.
exports.author_detail = asyncHandler(async (req, res, next) => {
  const author = await Author.findByPk(req.params.id);
  const allBooksByAuthor = await author.getBooks();

  if (author === null) {
    // No results.
    const err = new Error("Author not found");
    err.status = 404;
    return next(err);
  }

  res.render("author_detail", {
    title: "Author Detail",
    author: author,
    author_books: allBooksByAuthor,
  });
});

// Display Author create form on GET.
exports.author_create_get = (req, res, next) => {
  res.render("author_form", { title: "Create Author" });
};

// Handle Author create on POST.
exports.author_create_post = [
  body("first_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("First name must be specified."),
  body("family_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("Family name must be specified."),
  body("date_of_birth", "Invalid date of birth")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),
  body("date_of_death", "Invalid date of death")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    const { first_name, family_name, date_of_birth, date_of_death } = req.body;
    const author = Author.build({
      first_name,
      family_name,
      date_of_birth,
      date_of_death,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/errors messages.
      res.render("author_form", {
        title: "Create Author",
        author: author,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid.

      // Save author.
      await author.save();
      // Redirect to new author record.
      res.redirect(author.url);
    }
  }),
];

// Display Author delete form on GET.
// Display Author delete form on GET.
exports.author_delete_get = asyncHandler(async (req, res, next) => {
  // Get details of author and all their books (in parallel)
  const [author, allBooksByAuthor] = await Promise.all([
    Author.findByPk(req.params.id),
    Book.findAll({ where: { authorId: req.params.id } }),
  ]);

  if (author === null) {
    // No results.
    res.redirect("/catalog/authors");
  }

  res.render("author_delete", {
    title: "Delete Author",
    author: author,
    author_books: allBooksByAuthor,
  });
});

// Handle Author delete on POST.
exports.author_delete_post = asyncHandler(async (req, res, next) => {
  // Get details of author and all their books (in parallel)
  const [author, allBooksByAuthor] = await Promise.all([
    Author.findByPk(req.params.id),
    Book.findAll({ where: { authorId: req.params.id } }),
  ]);

  if (allBooksByAuthor.length > 0) {
    // Author has books. Render in same way as for GET route.
    res.render("author_delete", {
      title: "Delete Author",
      author: author,
      author_books: allBooksByAuthor,
    });
    return;
  } else {
    // Author has no books. Delete object and redirect to the list of authors.
    await Author.destroy({
      where: {
        id: req.body.authorid,
      },
    });
    res.redirect("/catalog/authors");
  }
});

// Display Author update form on GET.
exports.author_update_get = asyncHandler(async (req, res, next) => {
  // Get book, authors and genres for form.
  const author = await Author.findByPk(req.params.id);
  res.render("author_form", {
    title: "Update Author",
    author,
  });
});

// Handle Author update on POST.
exports.author_update_post = [
  body("first_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("First name must be specified."),
  body("family_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("Family name must be specified."),
  body("date_of_birth", "Invalid date of birth")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),
  body("date_of_death", "Invalid date of death")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    const author = await Author.findByPk(req.params.id);
    const { first_name, family_name, date_of_birth, date_of_death } = req.body;
    if (!errors.isEmpty) {
      res.render("author_form", {
        title: "Update Author",
        author,
        errors: errors.array()
      });

    } else {
      await author.update({
        first_name,
        family_name,
        date_of_birth,
        date_of_death,
      });
      res.redirect(author.url);
    }
  }),
];

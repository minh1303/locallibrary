const Book = require("../models/book");
const BookInstance = require("../models/bookinstance");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

// Display list of all BookInstances.
exports.bookinstance_list = asyncHandler(async (req, res, next) => {
  const allBookInstances = await BookInstance.findAll({ include: Book });
  res.render("bookinstance_list", {
    title: "Book Instance List",
    bookinstance_list: allBookInstances,
  });
});

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = asyncHandler(async (req, res, next) => {
  const getBookInstance = await BookInstance.findByPk(req.params.id);
  const Book = await getBookInstance.getBook();
  const bookInstance = {
    id: getBookInstance.id,
    status: getBookInstance.status,
    imprint: getBookInstance.imprint,
    due_back: getBookInstance.due_back,
    due_back_formatted: getBookInstance.due_back_formatted,
    url: getBookInstance.url,
    book: Book,
  };
  if (bookInstance === null) {
    // No results.
    const err = new Error("Book copy not found");
    err.status = 404;
    return next(err);
  }

  res.render("bookinstance_detail", {
    title: "Book:",
    bookinstance: bookInstance,
  });
});

// Display BookInstance create form on GET.
// Display BookInstance create form on GET.
exports.bookinstance_create_get = asyncHandler(async (req, res, next) => {
  const allBooks = await Book.findAll();
  res.render("bookinstance_form", {
    title: "Create BookInstance",
    book_list: allBooks,
  });
});

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  // Validate and sanitize fields.
  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid date")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);
    const { book, imprint, status, due_back } = req.body;
    // Create a BookInstance object with escaped and trimmed data.
    const bookInstance = {
      imprint,
      status,
      due_back,
    };

    if (!errors.isEmpty()) {
      // There are errors.
      // Render form again with sanitized values and error messages.
      const allBooks = await Book.findAll();
      return res.render("bookinstance_form", {
        title: "Create BookInstance",
        book_list: allBooks,
        selected_book: bookInstance.book.id,
        errors: errors.array(),
        bookinstance: bookInstance,
      });
    } else {
      // Data from form is valid
      const bookInstance = await BookInstance.create({
        imprint,
        status,
        due_back,
      });
      await bookInstance.setBook(book);
      res.redirect(bookInstance.url);
    }
  }),
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = asyncHandler(async (req, res, next) => {
  // Get details of book and all their book instances
  const bookinstance = await BookInstance.findByPk(req.params.id);
  if (bookinstance === null) {
    // No results.
    res.redirect("/catalog/bookinstances");
  }

  res.render("bookinstance_delete", {
    title: "Delete Book Instance",
    bookinstance: bookinstance,
  });
});

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = asyncHandler(async (req, res, next) => {
  // Get details of author and all their books (in parallel)

  // Author has no books. Delete object and redirect to the list of authors.
  await BookInstance.destroy({
    where: {
      id: req.body.bookinstanceid,
    },
  });
  res.redirect("/catalog/bookinstances");
});

// Display BookInstance update form on GET.
exports.bookinstance_update_get = asyncHandler(async (req, res, next) => {
  // Get book, authors and genres for form.
  const allBooks = await Book.findAll();
  const bookinstance = await BookInstance.findByPk(req.params.id);
  const selectedBook = await bookinstance.getBook();
  res.render("bookinstance_form", {
    title: "Update Book Instance",
    book_list: allBooks,
    selected_book: selectedBook.id,
    bookinstance: bookinstance,
  });
});

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
  // Validate and sanitize fields.
  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid date")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    const allBooks = await Book.findAll();
    const bookinstance = await BookInstance.findByPk(req.params.id);
    const selectedBook = await bookinstance.getBook();
    const {book, imprint, status , due_back} = req.body
    if (!errors.isEmpty()) {
      return   res.render("bookinstance_form", {
        title: "Update Book Instance",
        book_list: allBooks,
        selected_book: selectedBook.id,
        bookinstance: bookinstance,
        errors: errors.array()
      });
    } else {
      bookinstance.update({book, imprint, status , due_back})
      res.redirect(bookinstance.url)
    }
  }),
];

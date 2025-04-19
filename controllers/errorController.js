const {
  CustomError,
  NotFoundError,
  ValidationError,
  InternalServerError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
} = require('../utils/customError'); // adjust path if needed

// Development error response (detailed)
const sendErrorDev = (err, req, res) => {
  if (err instanceof NotFoundError) {
    return res.status(404).render('404', {
      title: 'Page Not Found',
      message: err.message,
    });
  }

  // Adding additionalInfo to error page
  res.status(err.statusCode || 500).render('error', {
    title: 'Error',
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode || 500,
    additionalInfo: err.additionalInfo || {}, // Ensure additionalInfo is always defined
  });
};

// Production error response (safe)
const sendErrorProd = (err, req, res) => {
  if (err instanceof NotFoundError) {
    return res.status(404).render('404', {
      title: 'Page Not Found',
      message: err.message,
    });
  }

  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      message: err.message,
      additionalInfo: err.additionalInfo || {}, // Ensure additionalInfo is always defined
    });
  }

  console.error('UNEXPECTED ERROR:', err);
  res.status(500).render('error', {
    title: 'Error',
    message: 'Something went wrong. Please try again later.',
    additionalInfo: {}, // Provide an empty object if no additional info exists
  });
};


// Catch-all global error handler
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.isOperational = err.isOperational ?? false;

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else {
    sendErrorProd(err, req, res);
  }
};

// 404 Handler
const notFoundHandler = (req, res, next) => {
  next(new NotFoundError(`Can't find ${req.originalUrl} on this server!`));
};

module.exports = {
  globalErrorHandler,
  notFoundHandler,
};

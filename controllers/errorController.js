const {
  CustomError,
  NotFoundError,
  ValidationError,
  InternalServerError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
} = require('../utils/customError');

// Development error response (detailed)
const sendErrorDev = (err, req, res) => {
  let statusCode = err.statusCode || 500;
  let view = 'error';
  let title = 'Error';

  if (err instanceof NotFoundError) {
    view = '404';
    title = 'Page Not Found';
    statusCode = 404;
  } else if (err instanceof ValidationError) {
    title = 'Validation Error';
    statusCode = 400;
  } else if (err instanceof UnauthorizedError) {
    title = 'Unauthorized';
    statusCode = 401;
  } else if (err instanceof ForbiddenError) {
    title = 'Forbidden';
    statusCode = 403;
  } else if (err instanceof ConflictError) {
    title = 'Conflict';
    statusCode = 409;
  } else if (err instanceof InternalServerError) {
    title = 'Internal Server Error';
    statusCode = 500;
  }

  res.status(statusCode).render(view, {
    title,
    message: err.message,
    stack: err.stack,
    statusCode,
    additionalInfo: err.additionalInfo || {},
    layout: false
  });
};

// Production error response (safe)
const sendErrorProd = (err, req, res) => {
  let statusCode = err.statusCode || 500;
  let view = 'error';
  let title = 'Something went wrong';
  let message = 'Something went wrong. Please try again later.';

  if (err instanceof NotFoundError) {
    view = '404';
    title = 'Page Not Found';
    message = err.message;
    statusCode = 404;
  } else if (err.isOperational) {
    if (err instanceof ValidationError) {
      title = 'Validation Error';
      message = err.message;
      statusCode = 400;
    } else if (err instanceof UnauthorizedError) {
      title = 'Unauthorized';
      message = err.message;
      statusCode = 401;
    } else if (err instanceof ForbiddenError) {
      title = 'Forbidden';
      message = err.message;
      statusCode = 403;
    } else if (err instanceof ConflictError) {
      title = 'Conflict';
      message = err.message;
      statusCode = 409;
    } else {
      message = err.message;
      statusCode = err.statusCode;
    }
  } else {
    console.error('UNEXPECTED ERROR:', err);
  }

  res.status(statusCode).render(view, {
    title,
    message,
    additionalInfo: err.additionalInfo || {},
    layout: false
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

// 404 Handler (used when no route matches)
const notFoundHandler = (req, res, next) => {
  next(new NotFoundError(`Can't find ${req.originalUrl} on this server!`));
};

module.exports = {
  globalErrorHandler,
  notFoundHandler,
};

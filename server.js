const express = require('express');
const {
  NotFoundError,
  ValidationError,
  InternalServerError,
  UnauthorizedError,
  ForbiddenError
} = require('./utils/customError');

const app = express();

// Middleware to simulate a validation error
app.use('/validate', (req, res, next) => {
  const { email } = req.query;
  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    return next(new ValidationError('Invalid email format'));
  }
  res.send('Valid email!');
});

// Route that throws a Not Found error
app.get('/not-found', (req, res, next) => {
  next(new NotFoundError('The page you are looking for does not exist.'));
});

// Route that throws an Unauthorized error
app.get('/unauthorized', (req, res, next) => {
  next(new UnauthorizedError('You need to log in to access this resource.'));
});

// Route that throws a Forbidden error
app.get('/forbidden', (req, res, next) => {
  next(new ForbiddenError('You do not have permission to access this resource.'));
});

// Route that throws an Internal Server Error
app.get('/server-error', (req, res, next) => {
  next(new InternalServerError('Something went wrong on the server.'));
});

// Global error handler
app.use((err, req, res, next) => {
  if (err instanceof CustomError) {
    return res.status(err.statusCode).json({
      error: {
        name: err.name,
        message: err.message,
        statusCode: err.statusCode,
        additionalInfo: err.additionalInfo,
      },
    });
  }

  // Default internal server error handler
  res.status(500).json({
    error: {
      name: 'InternalServerError',
      message: 'An unexpected error occurred',
      statusCode: 500,
    },
  });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

const express = require('express');
const app = express();

const { globalErrorHandler, notFoundHandler } = require('./controllers/errorController');

// Your routes go here
// app.use('/api/users', userRoutes);

// Handle 404
app.use(notFoundHandler);

// Global Error Handler
app.use(globalErrorHandler);

module.exports = app;

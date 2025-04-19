const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');
const compression = require('compression');
require('dotenv').config();

const { globalErrorHandler, notFoundHandler } = require('./controllers/errorController');

const app = express();

// ======= EJS Setup =======
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ======= Middleware =======
app.use(compression()); // Compression for performance
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1d' })); // Static file caching
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(helmet());  // Security headers
app.use(xss());     // XSS protection

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,  // Limit to 100 requests per window
  message: 'Too many requests, try again later.',
});
app.use('/api', limiter);  // Apply rate-limiting only on API routes

// ======= Example Test Route =======
app.get('/', (req, res) => {
  res.render('home', { title: 'Home Page' });
});

app.get('/login', (req, res) => {
  res.render('login', { message: null });
});

app.get('/forgot-password', (req, res) => {
  res.render('forgot-password', { message: null });
});

app.get('/reset-password', (req, res) => {
  const token = req.query.token;  // Get token from the query string
  res.render('reset-password', { message: null, token });
});


// ======= Error Handlers =======
app.use(notFoundHandler);
app.use(globalErrorHandler);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

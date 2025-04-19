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

// Demo route for the dashboard
app.get('/dashboard', (req, res) => {
  const demoData = {
    totalOrders: 250,
    pendingOrders: 50,
    completedOrders: 180,
    canceledOrders: 20,
    totalRevenue: 12000,
    mostOrderedItems: [
      { name: 'Burger', count: 75 },
      { name: 'Pizza', count: 60 },
      { name: 'Soda', count: 45 },
      { name: 'Pasta', count: 40 },
      { name: 'Salad', count: 30 }
    ],
    recentOrders: [
      { id: 101, customer: 'John Doe', status: 'Completed', total: 45, date: '2025-04-19' },
      { id: 102, customer: 'Jane Smith', status: 'Pending', total: 32, date: '2025-04-18' },
      { id: 103, customer: 'David Lee', status: 'Completed', total: 58, date: '2025-04-17' },
      { id: 104, customer: 'Sarah Kim', status: 'Canceled', total: 24, date: '2025-04-16' },
      { id: 105, customer: 'James Brown', status: 'Pending', total: 36, date: '2025-04-15' }
    ]
  };

  // Render the dashboard with demo data
  res.render('dashboard', demoData);
});

// ======= Error Handlers =======
app.use(notFoundHandler);
app.use(globalErrorHandler);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

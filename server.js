const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
require('dotenv').config();

const { globalErrorHandler, notFoundHandler } = require('./controllers/errorController');
const viewAdminRoutes = require('./routes/view/adminRoutes');
const viewLogsRoutes = require('./routes/view/logsRoutes');
const apiAdminRoutes = require('./routes/api/adminRoutes');
const {sequelize } = require('./config/db');

const app = express();

// ======= EJS Setup =======
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'admin/layout/layout');

// ======= Session Setup =======
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    },
  })
);

// ======= Middleware =======
app.use(compression());
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1d' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(helmet());
app.use(xss());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, try again later.',
});
app.use('/api', limiter);

// Flash Message Middleware
app.use((req, res, next) => {
  res.locals.success = req.session.success;
  res.locals.error = req.session.error;
  delete req.session.success;
  delete req.session.error;
  next();
});

app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});
// ======= Routes =======
app.get('/', (req, res) => {
  res.render('home', { title: 'Home Page', layout: false });
});

app.use('/admin', viewAdminRoutes);
app.use('/logs', viewLogsRoutes);
app.use('/api/admin', apiAdminRoutes);

app.get('/login', (req, res) => {
  res.render('login', { message: null, layout: false });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'password') {
    req.session.success = 'Login successful! Welcome back!';
    res.redirect('/dashboard');
  } else {
    req.session.error = 'Invalid username or password';
    res.redirect('/login');
  }
});

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
      { name: 'Salad', count: 30 },
    ],
    recentOrders: [
      { id: 101, customer: 'John Doe', status: 'Completed', total: 45, date: '2025-04-19' },
      { id: 102, customer: 'Jane Smith', status: 'Pending', total: 32, date: '2025-04-18' },
      { id: 103, customer: 'David Lee', status: 'Completed', total: 58, date: '2025-04-17' },
      { id: 104, customer: 'Sarah Kim', status: 'Canceled', total: 24, date: '2025-04-16' },
      { id: 105, customer: 'James Brown', status: 'Pending', total: 36, date: '2025-04-15' },
    ],
  };

  res.render('admin/dashboard', { title: 'Dashboard', ...demoData });
});

app.get('/forgot-password', (req, res) => {
  res.render('forgot-password', { message: null, layout: false });
});

app.get('/reset-password', (req, res) => {
  const token = req.query.token;
  res.render('reset-password', { message: null, token, layout: false });
});

// ======= Error Handlers =======
app.use(notFoundHandler);
app.use(globalErrorHandler);

// ======= Sequelize Init & Server Start =======
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    await sequelize.sync({ force : true }); // Keep schema updated
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ DB connection error:', error);
  }
})();

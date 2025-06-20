const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
//const webpush = require('web-push');
require('dotenv').config();

const { globalErrorHandler, notFoundHandler } = require('./controllers/errorController');
const viewAdminRoutes = require('./routes/view/adminRoutes');
const viewLogsRoutes = require('./routes/view/logsRoutes');
const viewOrderRoutes = require('./routes/view/orderRoutes');
const apiUserRoutes = require('./routes/api/userRoutes');
const viewUserRoutes = require('./routes/view/userRoutes');
const viewDashboardRoutes = require('./routes/view/dashboardRoutes');
const apiOrderRoutes = require('./routes/api/orderRoutes');
const categoryRoutes = require('./routes/view/categoryRoutes');
const apiAdminRoutes = require('./routes/api/adminRoutes');
const apiCategoryRoutes = require('./routes/api/categoryRoutes');
const adminController = require('./controllers/api/adminController');
const apiSubscriptionRoutes = require('./routes/api/subscriptionRoutes');
const { authenticateAndAuthorize } = require('./middleware/authMiddleware');
const { userBot } = require('./bots/userBot');
const { adminBot } = require('./bots/adminBot');
const { sequelize } = require('./config/db');

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
//app.use(helmet());
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
app.use('/admin',authenticateAndAuthorize('admin', 'manager'), viewAdminRoutes);
app.use('/logs',authenticateAndAuthorize('admin'), viewLogsRoutes);
app.use('/categories',authenticateAndAuthorize('admin', 'manager'), categoryRoutes);
app.use('/users', authenticateAndAuthorize('admin', 'manager'), viewUserRoutes);
app.use('/orders',authenticateAndAuthorize('admin', 'manager'), viewOrderRoutes);
app.use('/api/admin', authenticateAndAuthorize('admin'), apiAdminRoutes);
app.use('/api/categories', authenticateAndAuthorize('admin', 'manager'), apiCategoryRoutes);
app.use('/api/users', authenticateAndAuthorize('admin', 'manager'), apiUserRoutes);
app.use('/api/orders', authenticateAndAuthorize('admin', 'manager'), apiOrderRoutes);
app.use('/api/food', authenticateAndAuthorize('admin','manager'), require('./routes/api/foodRoutes'));
app.use('/food',authenticateAndAuthorize('admin', 'manager'), require('./routes/view/foodRoutes'));
app.use('/subscribe',authenticateAndAuthorize('admin', 'manager'), apiSubscriptionRoutes);
app.use('/dashboard',authenticateAndAuthorize('admin', 'manager'), viewDashboardRoutes);
// Login / Password Reset
app.get('/login', (req, res) => {
  res.render('login', { message: null, layout: false });
});

app.post('/login', adminController.login);
app.get('/forgot-password', (req, res) => {
  res.render('forgot-password', { message: null, layout: false });
});
app.post('/forgot-password', adminController.forgotPassword);
app.get('/reset-password', (req, res) => {
  const token = req.query.token;
  res.render('reset-password', { message: null, token, layout: false });
});
app.post('/reset-password', adminController.resetPassword);
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to log out' });
    }
    res.render('login', { message: null, layout: false });
  });
});
// Generate a new set of VAPID keys (public and private) for Web Push notifications
// These keys are needed to authenticate the server with push services (like Chrome, Firefox)
// You typically run this ONCE and then save the keys in your backend config or .env file
//const vapidKeys = webpush.generateVAPIDKeys();

//console.log(vapidKeys); // Prints the generated public and private VAPID keys to the console

// ======= Error Handlers =======
app.use(notFoundHandler);
app.use(globalErrorHandler);

// ======= Sequelize Init & Server Start =======
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    await sequelize.sync({ force : true });

    const PORT = process.env.PORT || 8080;

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port:${PORT}`);
    });
    
    console.log('Initializing user Bot...');
userBot.launch()
    .then(() => console.log('Admin Bot started successfully'))
    .catch((err) => console.error('Error starting user Bot:', err));
    
console.log('Initializing Admin Bot...');
adminBot.launch()
   .then(() => console.log('Admin Bot started successfully'))
   .catch((err) => console.error('Error starting Admin Bot:', err));

    // ======= Graceful Shutdown =======
    process.once('SIGINT', () => {
      userBot.stop('SIGINT');
      adminBot.stop('SIGINT');
    });

    process.once('SIGTERM', () => {
      userBot.stop('SIGTERM');
      adminBot.stop('SIGTERM');
    });

  } catch (error) {
    console.error('❌ DB connection error:', error);
  }
})();

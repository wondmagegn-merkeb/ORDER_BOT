# 🍔 ORDER_BOT

A comprehensive food ordering and management system with Telegram bot integration, admin dashboard, and real-time notifications.

## 📋 Table of Contents

- [Features](#features)
- [Technologies](#technologies)
- [Installation](#installation)
- [Configuration](#configuration)
- [Available Scripts](#available-scripts)
- [Database Setup](#database-setup)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Telegram Bots](#telegram-bots)
- [Features in Detail](#features-in-detail)

## ✨ Features

### Web Interface

- **Admin Dashboard**: Comprehensive dashboard with analytics, order management, and statistics
- **Food Management**: Create, update, and delete food items and categories
- **Order Management**: View, update, and track orders with detailed order information
- **User Management**: Manage users, view profiles, and track user activity
- **Admin Management**: Create and manage admin accounts with role-based access control
- **Audit Logs**: Track all changes made by administrators with detailed audit trails
- **Authentication**: Secure login, forgot password, and reset password functionality
- **Web Push Notifications**: Real-time browser notifications for order updates
- **Responsive Design**: Mobile-friendly interface with modern UI/UX

### Telegram Bot

- **User Bot**:
  - Browse food menus by category
  - Add items to cart with quantity management
  - Place orders and view order history
  - Manage user profile and details
  - Search food items by category
  - View last order and cart
- **Admin Bot**:
  - Receive order notifications
  - Manage orders via Telegram

### Notifications

- **Telegram Notifications**: Real-time order notifications to admins via Telegram
- **Web Push Notifications**: Browser-based push notifications for admins
- **Email Notifications**: Email support for password resets and system notifications

## 🛠 Technologies

- **Backend Framework**: Node.js, Express.js
- **Database**: MySQL with Sequelize ORM
- **Authentication**: JWT (JSON Web Tokens), Express Sessions
- **Bot Framework**: Telegraf (Telegram Bot API)
- **Image Storage**: Cloudinary
- **Push Notifications**: Web Push API
- **Email Service**: Nodemailer
- **Template Engine**: EJS
- **Security**: Helmet, XSS Clean, Rate Limiting, bcryptjs
- **Image Processing**: Sharp
- **Validation**: Joi

## 📦 Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd ORDER_BOT
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory with the following variables:

   ```env
   # Server
   PORT=8080
   NODE_ENV=development

   # Database
   MYSQL_ADDON_HOST=localhost
   MYSQL_ADDON_PORT=3306
   MYSQL_ADDON_DB=your_database_name
   MYSQL_ADDON_USER=your_username
   MYSQL_ADDON_PASSWORD=your_password

   # JWT
   JWT_SECRET=your_jwt_secret_key

   # Session
   SESSION_SECRET=your_session_secret_key

   # Telegram Bots
   USER_BOT_TOKEN=your_user_bot_token
   ADMIN_BOT_TOKEN=your_admin_bot_token

   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # Email (Nodemailer)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password

   # Web Push Notifications
   VAPID_PUBLIC_KEY=your_vapid_public_key
   VAPID_PRIVATE_KEY=your_vapid_private_key
   VAPID_EMAIL=mailto:your_email@example.com
   ```

4. **Generate VAPID keys** (for web push notifications)

   ```bash
   npm run generate-vapid-keys
   ```

5. **Run database migrations**

   ```bash
   npm run fix-cloudinary
   npm run migrate-items
   npm run fix-endpoint
   ```

6. **Start the server**

   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## ⚙️ Configuration

### Database Setup

1. Create a MySQL database
2. Update database credentials in `.env` file
3. The application will automatically sync database schema on startup

### Telegram Bot Setup

1. Create two Telegram bots using [@BotFather](https://t.me/botfather)
2. Get bot tokens for both user and admin bots
3. Add tokens to `.env` file

### Cloudinary Setup

1. Create a Cloudinary account
2. Get your cloud name, API key, and API secret
3. Add credentials to `.env` file

## 📜 Available Scripts

- `npm start` - Start the server in production mode
- `npm run dev` - Start the server in development mode with nodemon
- `npm run generate-vapid-keys` - Generate VAPID keys for web push notifications
- `npm run add-admin` - Add a new admin user to the database
- `npm run add-categories` - Add food categories to the database
- `npm run add-food` - Add food items to the database
- `npm run fix-cloudinary` - Fix Cloudinary column type in database
- `npm run migrate-items` - Add items column to orders table
- `npm run fix-endpoint` - Update endpoint column to TEXT type for push subscriptions

## 🗄 Database Setup

The application uses Sequelize ORM with MySQL. Key models include:

- **Admin**: Admin accounts with roles (admin, manager, delivery)
- **User**: Telegram users who place orders
- **Food**: Food items with categories, prices, and images
- **FoodCategory**: Categories for organizing food items
- **Order**: Order records with items, status, and customer information
- **AdminAuditLog**: Audit logs for admin actions
- **OrderUpdateLog**: Logs for order status changes
- **UserUpdateLog**: Logs for user profile updates
- **FoodUpdateLog**: Logs for food item changes
- **FoodCategoryUpdateLog**: Logs for category changes

## 📁 Project Structure

```
ORDER_BOT/
├── bots/                    # Telegram bot handlers
│   ├── adminBot.js         # Admin bot configuration
│   ├── userBot.js          # User bot configuration
│   ├── adminHandlers/      # Admin bot command handlers
│   └── userHandlers/       # User bot command handlers
├── config/                 # Configuration files
│   ├── db.js              # Database configuration
│   └── cloudinary.js      # Cloudinary configuration
├── controllers/            # Request handlers
│   ├── api/               # API controllers
│   └── view/              # View controllers
├── middleware/            # Express middleware
│   ├── authMiddleware.js  # Authentication middleware
│   └── uploadMiddleware.js # File upload middleware
├── models/                # Sequelize models
├── routes/                # Route definitions
│   ├── api/              # API routes
│   └── view/             # View routes
├── scripts/               # Utility scripts
├── public/                # Static files
│   ├── service-worker.js  # Service worker for push notifications
│   └── uploads/          # Uploaded files
├── utils/                 # Utility functions
├── validators/            # Input validation schemas
├── views/                 # EJS templates
│   └── admin/            # Admin panel views
├── server.js              # Main server file
└── package.json           # Dependencies and scripts
```

## 🔌 API Endpoints

### Authentication

- `POST /api/admin/login` - Admin login
- `POST /api/admin/forgot-password` - Request password reset
- `POST /api/admin/reset-password` - Reset password with token

### Orders

- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get order by ID
- `PUT /api/orders/:id` - Update order status
- `POST /api/orders/:id/confirm` - Confirm order

### Users

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user

### Food & Categories

- `GET /api/foods` - Get all food items
- `POST /api/foods` - Create food item
- `PUT /api/foods/:id` - Update food item
- `DELETE /api/foods/:id` - Delete food item
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Subscriptions

- `POST /subscribe` - Subscribe to web push notifications
- `POST /subscribe/unsubscribe` - Unsubscribe from notifications

## 🤖 Telegram Bots

### User Bot Features

- `/start` - Welcome message and menu
- `view menu` - Browse food items
- `search by category` - Filter foods by category
- `🛒 View Cart` - View and manage cart
- `last order` - View last placed order
- `history` - View order history
- `profile` - Manage user profile

### Admin Bot Features

- Receives notifications for new orders
- Order management commands

## 📱 Features in Detail

### Admin Dashboard

- **Analytics**: Real-time statistics including:
  - Total orders, revenue, and users
  - Top selling items (weekly, monthly, yearly)
  - Order status breakdown
  - Recent activity
- **Order Management**:
  - View all orders with filtering
  - Update order status
  - View detailed order information with all items
  - Order confirmation with notifications
- **User Management**: View and manage user accounts
- **Food Management**: CRUD operations for food items and categories
- **Audit Logs**: Track all administrative actions

### Web Push Notifications

- Real-time browser notifications for admins
- Subscribe/unsubscribe functionality
- Automatic notification on order confirmation
- Works across different browsers (Chrome, Firefox, Edge)

### Security Features

- JWT-based authentication
- Session management with secure cookies
- Password hashing with bcrypt
- Rate limiting for API endpoints
- XSS protection
- Helmet.js for security headers
- Role-based access control (admin, manager, delivery)

### Image Management

- Cloudinary integration for image storage
- Automatic image optimization
- Support for multiple image formats
- Local file upload support

## 🔒 Security

- Password hashing with bcryptjs
- JWT token authentication
- Session-based authentication
- Rate limiting on API endpoints
- XSS protection
- Helmet.js security headers
- SQL injection prevention with Sequelize
- Input validation with Joi

## 📦 Creating a Clean Package

If you need to share or distribute the project, use the clean package script to exclude unnecessary files:

```bash
npm run package-clean
```

This will create a clean version in `temp_package/` directory that excludes:

- `node_modules/` (recipients should run `npm install`)
- Uploaded files and temporary data
- Environment files (`.env`)
- Session data
- ZIP files

Then create a ZIP file:

```bash
cd temp_package
zip -r ../ORDER_BOT_clean.zip .
```

**Note**: If antivirus software flags the ZIP file, it's likely a false positive. The project contains only legitimate Node.js code with standard dependencies. The clean package script helps reduce false positives by excluding `node_modules` and other unnecessary files.

## 📝 License

ISC

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For support, please open an issue in the repository.

---

**Note**: Make sure to set up all environment variables before running the application. The application requires MySQL database, Telegram bot tokens, Cloudinary credentials, and VAPID keys for full functionality.

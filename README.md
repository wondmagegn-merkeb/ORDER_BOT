# ORDER_BOT

## 🍔 ORDER_BOT: Seamless Food Ordering and Management

## Features

*   **Web Interface:**
    *   Admin dashboard for managing food categories, food items, orders, users, and other administrators.
    *   Audit logs for tracking changes made by administrators.
    *   User management with options to view and update user details.
    *   Authentication (login, forgot password, reset password).
*   **Telegram Bot:**
    *   Users can browse food menus.
    *   Users can place orders.
    *   Handlers for various user interactions.
*   **Push Notifications:** (Based on web-push dependency)
    *   Likely used for notifying users or admins about order updates or other events.
*   **Image Uploads:** (Based on cloudinary dependency)
    *   Integration with Cloudinary for storing images, likely for food items.
*   **Emailing:** (Based on nodemailer)
    *   Used for sending emails, potentially for password resets or order confirmations.
*   **Database:** (Based on sequelize)
    *   Utilizes Sequelize as an ORM for interacting with a database (database type not specified in dependencies, but `.sql` file suggests a relational database).

## Technologies

*   Node.js
*   Express.js
*   Sequelize (ORM)
*   Telegram Bot API



INSERT INTO `admins` (`adminId`, `username`, `email`, `password`, `telegramId`, `states`, `role`, `mustChangeCredentials`, `resetToken`, `resetTokenExpires`, `createdBy`, `updatedBy`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
('ADM001', 'admin_1745243153278', 'wondmagegnmerkebbeleka@gmail.com', '$2b$10$JXpmMwhy.XebA1K8ZbSa3eeAuD5OT5lGhjACCuAWwvsJ148u/y1.W', '7816314576', 'active', 'admin', 1, NULL, NULL, 'ADM001', NULL, '2025-04-21 13:45:53', '2025-04-21 13:45:53', NULL),
('ADM002', 'admin_1745248703779', 'eyukk@gmail.com', '$2b$10$hTVHKfedbGWWC08dxuCS0uJFQfX4eUOX5dJz.6X0Kr5Vz7tFQAjaS', '7816314578', 'active', 'admin', 1, NULL, NULL, 'ADM001', NULL, '2025-04-21 15:18:24', '2025-04-21 15:18:24', NULL);

INSERT INTO `admin_audit_logs` (`id`, `action`, `performedBy`, `oldData`, `newData`, `createdAt`, `updatedAt`) VALUES
(1, 'CREATE', 'ADM001', NULL, '{\"role\": \"admin\", \"email\": \"wondmagegnmerkebbeleka@gmail.com\", \"states\": \"active\", \"adminId\": \"ADM001\", \"password\": \"$2b$10$JXpmMwhy.XebA1K8ZbSa3eeAuD5OT5lGhjACCuAWwvsJ148u/y1.W\", \"username\": \"admin_1745243153278\", \"createdAt\": \"2025-04-21T13:45:53.822Z\", \"createdBy\": \"ADM001\", \"updatedAt\": \"2025-04-21T13:45:53.822Z\", \"telegramId\": \"7816314577\", \"mustChangeCredentials\": true}', '2025-04-21 13:45:53', '2025-04-21 13:45:53'),
(2, 'CREATE', 'ADM001', NULL, '{\"role\": \"admin\", \"email\": \"eyukk@gmail.com\", \"states\": \"active\", \"adminId\": \"ADM002\", \"password\": \"$2b$10$hTVHKfedbGWWC08dxuCS0uJFQfX4eUOX5dJz.6X0Kr5Vz7tFQAjaS\", \"username\": \"admin_1745248703779\", \"createdAt\": \"2025-04-21T15:18:24.366Z\", \"createdBy\": \"ADM001\", \"updatedAt\": \"2025-04-21T15:18:24.366Z\", \"telegramId\": \"7816314578\", \"mustChangeCredentials\": true}', '2025-04-21 15:18:24', '2025-04-21 15:18:24');

INSERT INTO `food_categories` (`categoryId`, `categoryName`, `description`, `createdBy`, `updatedBy`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
('CAT001', 'Beverages', '', 'ADM001', 'ADM001', '2025-04-22 13:26:14', '2025-04-22 13:26:14', NULL);

INSERT INTO `food_category_update_logs` (`id`, `categoryId`, `oldValue`, `newValue`, `performedBy`, `action`, `createdAt`, `updatedAt`) VALUES
(1, 'CAT001', NULL, '{\"createdAt\": \"2025-04-22T13:26:14.480Z\", \"createdBy\": \"ADM001\", \"updatedAt\": \"2025-04-22T13:26:14.480Z\", \"updatedBy\": \"ADM001\", \"categoryId\": \"CAT001\", \"description\": \"\", \"categoryName\": \"Beverages\"}', 'ADM001', 'CREATE', '2025-04-22 13:26:14', '2025-04-22 13:26:14');

INSERT INTO `users` (`userId`, `telegramId`, `username`, `status`, `userType`, `updatedBy`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
('USR001', '7816314576', NULL, 'active', 'customer', NULL, '2025-04-22 13:42:01', '2025-04-22 13:42:01', NULL);

INSERT INTO `foods` (`foodId`, `name`, `description`, `price`, `isAvailable`, `imageUrl`, `categoryId`, `cloudinaryPublicId`, `createdBy`, `updatedBy`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
('FOOD001', 'Cheeseburger', 'My name is bla bla', 21, 1, 'https://res.cloudinary.com/dx6koeeva/image/upload/v1745345293/foods/jraymwjpwxx3jsxmeha3.webp', 'CAT001', 'foods/jraymwjpwxx3jsxmeha3', 'ADM001', 'ADM001', '2025-04-22 18:08:14', '2025-04-22 18:08:14', NULL),
('FOOD002', 'Cheeseburge', 'My name is bla bla', 21, 1, 'https://res.cloudinary.com/dx6koeeva/image/upload/v1745346462/foods/j6eelrbpqjp87otd5fpp.webp', 'CAT001', 'foods/j6eelrbpqjp87otd5fpp', 'ADM001', 'ADM001', '2025-04-22 18:27:43', '2025-04-22 18:27:43', NULL);

INSERT INTO `orders` (`orderId`, `userId`, `foodId`, `quantity`, `specialOrder`, `totalPrice`, `newTotalPrice`, `status`, `createdBy`, `updatedBy`, `location`, `latitude`, `longitude`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
('ORD001', 'USR001', 'FOOD002', 3, '3', 63.00, 63.00, 'pending', 'USR001', NULL, 'N', 7.04949, 38.4884, '2025-04-23 20:47:31', '2025-04-23 20:47:31', NULL),
('ORD002', 'USR001', 'FOOD002', 2, 'Not special order', 42.00, 42.00, 'progress', 'USR001', NULL, 'Yjkj', 7.0531, 38.4902, '2025-04-23 22:52:03', '2025-04-24 07:51:52', NULL),
('ORD003', 'USR001', 'FOOD002', 5, 'Not special order', 105.00, 105.00, 'pending', 'USR001', NULL, 'Jj', 7.05313, 38.4911, '2025-04-24 04:29:08', '2025-04-24 04:29:08', NULL);

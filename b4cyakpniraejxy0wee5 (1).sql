

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

INSERT INTO `food_update_logs` (`id`, `foodId`, `field`, `oldValue`, `newValue`, `performedBy`, `action`, `createdAt`, `updatedAt`) VALUES
(1, 'FOOD001', 'name', NULL, 'Cheeseburger', 'ADM001', 'create', '2025-04-22 18:08:14', '2025-04-22 18:08:14'),
(2, 'FOOD001', 'description', NULL, 'My name is bla bla', 'ADM001', 'create', '2025-04-22 18:08:14', '2025-04-22 18:08:14'),
(3, 'FOOD001', 'price', NULL, '21', 'ADM001', 'create', '2025-04-22 18:08:14', '2025-04-22 18:08:14'),
(4, 'FOOD001', 'isAvailable', NULL, 'true', 'ADM001', 'create', '2025-04-22 18:08:14', '2025-04-22 18:08:14'),
(5, 'FOOD001', 'imageUrl', NULL, 'https://res.cloudinary.com/dx6koeeva/image/upload/v1745345293/foods/jraymwjpwxx3jsxmeha3.webp', 'ADM001', 'create', '2025-04-22 18:08:14', '2025-04-22 18:08:14'),
(6, 'FOOD001', 'categoryId', NULL, 'CAT001', 'ADM001', 'create', '2025-04-22 18:08:14', '2025-04-22 18:08:14'),
(7, 'FOOD002', 'name', NULL, 'Cheeseburge', 'ADM001', 'create', '2025-04-22 18:27:43', '2025-04-22 18:27:43'),
(8, 'FOOD002', 'description', NULL, 'My name is bla bla', 'ADM001', 'create', '2025-04-22 18:27:43', '2025-04-22 18:27:43'),
(9, 'FOOD002', 'price', NULL, '21', 'ADM001', 'create', '2025-04-22 18:27:43', '2025-04-22 18:27:43'),
(10, 'FOOD002', 'isAvailable', NULL, 'true', 'ADM001', 'create', '2025-04-22 18:27:43', '2025-04-22 18:27:43'),
(11, 'FOOD002', 'imageUrl', NULL, 'https://res.cloudinary.com/dx6koeeva/image/upload/v1745346462/foods/j6eelrbpqjp87otd5fpp.webp', 'ADM001', 'create', '2025-04-22 18:27:43', '2025-04-22 18:27:43'),
(12, 'FOOD002', 'categoryId', NULL, 'CAT001', 'ADM001', 'create', '2025-04-22 18:27:43', '2025-04-22 18:27:43');

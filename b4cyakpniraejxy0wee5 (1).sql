

INSERT INTO `admins` (`adminId`, `username`, `email`, `password`, `telegramId`, `states`, `role`, `mustChangeCredentials`, `resetToken`, `resetTokenExpires`, `createdBy`, `updatedBy`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
('ADM001', 'admin_1745243153278', 'wondmagegnmerkebbeleka@gmail.com', '$2b$10$JXpmMwhy.XebA1K8ZbSa3eeAuD5OT5lGhjACCuAWwvsJ148u/y1.W', '7816314577', 'active', 'admin', 1, NULL, NULL, 'ADM001', NULL, '2025-04-21 13:45:53', '2025-04-21 13:45:53', NULL),
('ADM002', 'admin_1745248703779', 'eyukk@gmail.com', '$2b$10$hTVHKfedbGWWC08dxuCS0uJFQfX4eUOX5dJz.6X0Kr5Vz7tFQAjaS', '7816314578', 'active', 'admin', 1, NULL, NULL, 'ADM001', NULL, '2025-04-21 15:18:24', '2025-04-21 15:18:24', NULL);



INSERT INTO `admin_audit_logs` (`id`, `action`, `performedBy`, `oldData`, `newData`, `createdAt`, `updatedAt`) VALUES
(1, 'CREATE', 'ADM001', NULL, '{\"role\": \"admin\", \"email\": \"wondmagegnmerkebbeleka@gmail.com\", \"states\": \"active\", \"adminId\": \"ADM001\", \"password\": \"$2b$10$JXpmMwhy.XebA1K8ZbSa3eeAuD5OT5lGhjACCuAWwvsJ148u/y1.W\", \"username\": \"admin_1745243153278\", \"createdAt\": \"2025-04-21T13:45:53.822Z\", \"createdBy\": \"ADM001\", \"updatedAt\": \"2025-04-21T13:45:53.822Z\", \"telegramId\": \"7816314577\", \"mustChangeCredentials\": true}', '2025-04-21 13:45:53', '2025-04-21 13:45:53'),
(2, 'CREATE', 'ADM001', NULL, '{\"role\": \"admin\", \"email\": \"eyukk@gmail.com\", \"states\": \"active\", \"adminId\": \"ADM002\", \"password\": \"$2b$10$hTVHKfedbGWWC08dxuCS0uJFQfX4eUOX5dJz.6X0Kr5Vz7tFQAjaS\", \"username\": \"admin_1745248703779\", \"createdAt\": \"2025-04-21T15:18:24.366Z\", \"createdBy\": \"ADM001\", \"updatedAt\": \"2025-04-21T15:18:24.366Z\", \"telegramId\": \"7816314578\", \"mustChangeCredentials\": true}', '2025-04-21 15:18:24', '2025-04-21 15:18:24');


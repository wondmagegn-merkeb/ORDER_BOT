-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: b4cyakpniraejxy0wee5-mysql.services.clever-cloud.com:3306
-- Generation Time: Apr 21, 2025 at 03:42 PM
-- Server version: 8.0.22-13
-- PHP Version: 8.2.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `b4cyakpniraejxy0wee5`
--

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `adminId` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `telegramId` varchar(255) NOT NULL,
  `states` varchar(255) DEFAULT 'active',
  `role` varchar(255) DEFAULT 'admin',
  `mustChangeCredentials` tinyint(1) DEFAULT '1',
  `resetToken` varchar(255) DEFAULT NULL,
  `resetTokenExpires` datetime DEFAULT NULL,
  `createdBy` varchar(255) DEFAULT NULL,
  `updatedBy` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deletedAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`adminId`, `username`, `email`, `password`, `telegramId`, `states`, `role`, `mustChangeCredentials`, `resetToken`, `resetTokenExpires`, `createdBy`, `updatedBy`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
('ADM001', 'admin_1745243153278', 'wondmagegnmerkebbeleka@gmail.com', '$2b$10$JXpmMwhy.XebA1K8ZbSa3eeAuD5OT5lGhjACCuAWwvsJ148u/y1.W', '7816314577', 'active', 'admin', 1, NULL, NULL, 'ADM001', NULL, '2025-04-21 13:45:53', '2025-04-21 13:45:53', NULL),
('ADM002', 'admin_1745248703779', 'eyukk@gmail.com', '$2b$10$hTVHKfedbGWWC08dxuCS0uJFQfX4eUOX5dJz.6X0Kr5Vz7tFQAjaS', '7816314578', 'active', 'admin', 1, NULL, NULL, 'ADM001', NULL, '2025-04-21 15:18:24', '2025-04-21 15:18:24', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `admin_audit_logs`
--

CREATE TABLE `admin_audit_logs` (
  `id` int NOT NULL,
  `action` enum('CREATE','UPDATE','DELETE') NOT NULL,
  `performedBy` varchar(255) DEFAULT NULL,
  `oldData` json DEFAULT NULL,
  `newData` json DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `admin_audit_logs`
--

INSERT INTO `admin_audit_logs` (`id`, `action`, `performedBy`, `oldData`, `newData`, `createdAt`, `updatedAt`) VALUES
(1, 'CREATE', 'ADM001', NULL, '{\"role\": \"admin\", \"email\": \"wondmagegnmerkebbeleka@gmail.com\", \"states\": \"active\", \"adminId\": \"ADM001\", \"password\": \"$2b$10$JXpmMwhy.XebA1K8ZbSa3eeAuD5OT5lGhjACCuAWwvsJ148u/y1.W\", \"username\": \"admin_1745243153278\", \"createdAt\": \"2025-04-21T13:45:53.822Z\", \"createdBy\": \"ADM001\", \"updatedAt\": \"2025-04-21T13:45:53.822Z\", \"telegramId\": \"7816314577\", \"mustChangeCredentials\": true}', '2025-04-21 13:45:53', '2025-04-21 13:45:53'),
(2, 'CREATE', 'ADM001', NULL, '{\"role\": \"admin\", \"email\": \"eyukk@gmail.com\", \"states\": \"active\", \"adminId\": \"ADM002\", \"password\": \"$2b$10$hTVHKfedbGWWC08dxuCS0uJFQfX4eUOX5dJz.6X0Kr5Vz7tFQAjaS\", \"username\": \"admin_1745248703779\", \"createdAt\": \"2025-04-21T15:18:24.366Z\", \"createdBy\": \"ADM001\", \"updatedAt\": \"2025-04-21T15:18:24.366Z\", \"telegramId\": \"7816314578\", \"mustChangeCredentials\": true}', '2025-04-21 15:18:24', '2025-04-21 15:18:24');

-- --------------------------------------------------------

--
-- Table structure for table `foods`
--

CREATE TABLE `foods` (
  `foodId` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `price` float NOT NULL,
  `isAvailable` tinyint(1) DEFAULT '1',
  `imageUrl` varchar(255) DEFAULT NULL,
  `categoryId` varchar(255) NOT NULL,
  `createdBy` varchar(255) DEFAULT NULL,
  `updatedBy` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deletedAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `food_categories`
--

CREATE TABLE `food_categories` (
  `categoryId` varchar(255) NOT NULL,
  `categoryName` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `createdBy` varchar(255) DEFAULT NULL,
  `updatedBy` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deletedAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `food_category_update_logs`
--

CREATE TABLE `food_category_update_logs` (
  `id` int NOT NULL,
  `categoryId` varchar(255) NOT NULL,
  `oldValue` varchar(255) DEFAULT NULL,
  `newValue` varchar(255) NOT NULL,
  `performedBy` varchar(255) NOT NULL,
  `action` enum('CREATE','UPDATE','DELETE') NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `food_update_logs`
--

CREATE TABLE `food_update_logs` (
  `id` int NOT NULL,
  `foodId` varchar(255) NOT NULL,
  `field` varchar(255) NOT NULL,
  `oldValue` varchar(255) DEFAULT NULL,
  `newValue` varchar(255) NOT NULL,
  `performedBy` varchar(255) NOT NULL,
  `action` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `orderId` varchar(255) NOT NULL,
  `userId` varchar(255) NOT NULL,
  `fullName` varchar(255) NOT NULL,
  `phoneNumber1` varchar(255) NOT NULL,
  `phoneNumber2` varchar(255) DEFAULT NULL,
  `foodId` varchar(255) NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `specialOrder` varchar(255) DEFAULT NULL,
  `totalPrice` decimal(10,2) NOT NULL,
  `newTotalPrice` decimal(10,2) NOT NULL,
  `status` varchar(255) DEFAULT 'pending',
  `createdBy` varchar(255) DEFAULT NULL,
  `updatedBy` varchar(255) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `latitude` float DEFAULT NULL,
  `longitude` float DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deletedAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `order_update_logs`
--

CREATE TABLE `order_update_logs` (
  `id` int NOT NULL,
  `orderId` varchar(255) NOT NULL,
  `field` enum('status','newTotalPrice') NOT NULL,
  `oldValue` varchar(255) DEFAULT NULL,
  `newValue` varchar(255) NOT NULL,
  `performedBy` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `userId` varchar(255) NOT NULL,
  `telegramId` varchar(255) NOT NULL,
  `username` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT 'active',
  `userType` varchar(255) DEFAULT 'customer',
  `createdBy` varchar(255) DEFAULT NULL,
  `updatedBy` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deletedAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `user_update_logs`
--

CREATE TABLE `user_update_logs` (
  `id` int NOT NULL,
  `userId` varchar(255) NOT NULL,
  `field` enum('status','userType') NOT NULL,
  `oldValue` varchar(255) DEFAULT NULL,
  `newValue` varchar(255) NOT NULL,
  `performedBy` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`adminId`),
  ADD UNIQUE KEY `adminId` (`adminId`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `telegramId` (`telegramId`),
  ADD UNIQUE KEY `username_2` (`username`),
  ADD UNIQUE KEY `email_2` (`email`),
  ADD UNIQUE KEY `telegramId_2` (`telegramId`),
  ADD UNIQUE KEY `username_3` (`username`),
  ADD UNIQUE KEY `email_3` (`email`),
  ADD UNIQUE KEY `telegramId_3` (`telegramId`),
  ADD UNIQUE KEY `username_4` (`username`),
  ADD UNIQUE KEY `email_4` (`email`),
  ADD UNIQUE KEY `telegramId_4` (`telegramId`),
  ADD UNIQUE KEY `username_5` (`username`),
  ADD UNIQUE KEY `email_5` (`email`),
  ADD UNIQUE KEY `telegramId_5` (`telegramId`),
  ADD UNIQUE KEY `username_6` (`username`),
  ADD UNIQUE KEY `email_6` (`email`),
  ADD UNIQUE KEY `telegramId_6` (`telegramId`),
  ADD UNIQUE KEY `username_7` (`username`),
  ADD UNIQUE KEY `email_7` (`email`),
  ADD UNIQUE KEY `telegramId_7` (`telegramId`),
  ADD UNIQUE KEY `username_8` (`username`),
  ADD UNIQUE KEY `email_8` (`email`),
  ADD UNIQUE KEY `telegramId_8` (`telegramId`),
  ADD UNIQUE KEY `username_9` (`username`),
  ADD UNIQUE KEY `email_9` (`email`),
  ADD UNIQUE KEY `telegramId_9` (`telegramId`),
  ADD UNIQUE KEY `username_10` (`username`),
  ADD UNIQUE KEY `email_10` (`email`),
  ADD UNIQUE KEY `telegramId_10` (`telegramId`),
  ADD UNIQUE KEY `username_11` (`username`),
  ADD UNIQUE KEY `email_11` (`email`),
  ADD UNIQUE KEY `telegramId_11` (`telegramId`),
  ADD UNIQUE KEY `username_12` (`username`),
  ADD UNIQUE KEY `email_12` (`email`),
  ADD UNIQUE KEY `telegramId_12` (`telegramId`),
  ADD UNIQUE KEY `username_13` (`username`),
  ADD UNIQUE KEY `email_13` (`email`),
  ADD UNIQUE KEY `telegramId_13` (`telegramId`),
  ADD UNIQUE KEY `username_14` (`username`),
  ADD UNIQUE KEY `email_14` (`email`),
  ADD UNIQUE KEY `telegramId_14` (`telegramId`),
  ADD UNIQUE KEY `username_15` (`username`),
  ADD UNIQUE KEY `email_15` (`email`),
  ADD UNIQUE KEY `telegramId_15` (`telegramId`),
  ADD UNIQUE KEY `username_16` (`username`),
  ADD UNIQUE KEY `email_16` (`email`),
  ADD UNIQUE KEY `telegramId_16` (`telegramId`),
  ADD UNIQUE KEY `username_17` (`username`),
  ADD UNIQUE KEY `email_17` (`email`),
  ADD UNIQUE KEY `telegramId_17` (`telegramId`),
  ADD UNIQUE KEY `username_18` (`username`),
  ADD UNIQUE KEY `email_18` (`email`),
  ADD UNIQUE KEY `telegramId_18` (`telegramId`),
  ADD UNIQUE KEY `username_19` (`username`),
  ADD UNIQUE KEY `email_19` (`email`),
  ADD UNIQUE KEY `telegramId_19` (`telegramId`),
  ADD UNIQUE KEY `username_20` (`username`),
  ADD UNIQUE KEY `email_20` (`email`),
  ADD UNIQUE KEY `telegramId_20` (`telegramId`),
  ADD UNIQUE KEY `username_21` (`username`),
  ADD UNIQUE KEY `email_21` (`email`);

--
-- Indexes for table `admin_audit_logs`
--
ALTER TABLE `admin_audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `performedBy` (`performedBy`);

--
-- Indexes for table `foods`
--
ALTER TABLE `foods`
  ADD PRIMARY KEY (`foodId`),
  ADD UNIQUE KEY `foodId` (`foodId`),
  ADD KEY `categoryId` (`categoryId`),
  ADD KEY `createdBy` (`createdBy`),
  ADD KEY `updatedBy` (`updatedBy`);

--
-- Indexes for table `food_categories`
--
ALTER TABLE `food_categories`
  ADD PRIMARY KEY (`categoryId`),
  ADD UNIQUE KEY `categoryId` (`categoryId`),
  ADD UNIQUE KEY `categoryName` (`categoryName`),
  ADD UNIQUE KEY `categoryName_2` (`categoryName`),
  ADD UNIQUE KEY `categoryName_3` (`categoryName`),
  ADD UNIQUE KEY `categoryName_4` (`categoryName`),
  ADD UNIQUE KEY `categoryName_5` (`categoryName`),
  ADD UNIQUE KEY `categoryName_6` (`categoryName`),
  ADD UNIQUE KEY `categoryName_7` (`categoryName`),
  ADD UNIQUE KEY `categoryName_8` (`categoryName`),
  ADD UNIQUE KEY `categoryName_9` (`categoryName`),
  ADD UNIQUE KEY `categoryName_10` (`categoryName`),
  ADD UNIQUE KEY `categoryName_11` (`categoryName`),
  ADD UNIQUE KEY `categoryName_12` (`categoryName`),
  ADD UNIQUE KEY `categoryName_13` (`categoryName`),
  ADD UNIQUE KEY `categoryName_14` (`categoryName`),
  ADD UNIQUE KEY `categoryName_15` (`categoryName`),
  ADD UNIQUE KEY `categoryName_16` (`categoryName`),
  ADD UNIQUE KEY `categoryName_17` (`categoryName`),
  ADD UNIQUE KEY `categoryName_18` (`categoryName`),
  ADD UNIQUE KEY `categoryName_19` (`categoryName`),
  ADD UNIQUE KEY `categoryName_20` (`categoryName`),
  ADD KEY `createdBy` (`createdBy`),
  ADD KEY `updatedBy` (`updatedBy`);

--
-- Indexes for table `food_category_update_logs`
--
ALTER TABLE `food_category_update_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `food_update_logs`
--
ALTER TABLE `food_update_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `foodId` (`foodId`),
  ADD KEY `performedBy` (`performedBy`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`orderId`),
  ADD UNIQUE KEY `orderId` (`orderId`),
  ADD KEY `userId` (`userId`),
  ADD KEY `foodId` (`foodId`),
  ADD KEY `createdBy` (`createdBy`),
  ADD KEY `updatedBy` (`updatedBy`);

--
-- Indexes for table `order_update_logs`
--
ALTER TABLE `order_update_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `orderId` (`orderId`),
  ADD KEY `performedBy` (`performedBy`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`userId`),
  ADD UNIQUE KEY `userId` (`userId`),
  ADD UNIQUE KEY `telegramId` (`telegramId`),
  ADD UNIQUE KEY `telegramId_2` (`telegramId`),
  ADD UNIQUE KEY `telegramId_3` (`telegramId`),
  ADD UNIQUE KEY `telegramId_4` (`telegramId`),
  ADD UNIQUE KEY `telegramId_5` (`telegramId`),
  ADD UNIQUE KEY `telegramId_6` (`telegramId`),
  ADD UNIQUE KEY `telegramId_7` (`telegramId`),
  ADD UNIQUE KEY `telegramId_8` (`telegramId`),
  ADD UNIQUE KEY `telegramId_9` (`telegramId`),
  ADD UNIQUE KEY `telegramId_10` (`telegramId`),
  ADD UNIQUE KEY `telegramId_11` (`telegramId`),
  ADD UNIQUE KEY `telegramId_12` (`telegramId`),
  ADD UNIQUE KEY `telegramId_13` (`telegramId`),
  ADD UNIQUE KEY `telegramId_14` (`telegramId`),
  ADD UNIQUE KEY `telegramId_15` (`telegramId`),
  ADD UNIQUE KEY `telegramId_16` (`telegramId`),
  ADD UNIQUE KEY `telegramId_17` (`telegramId`),
  ADD UNIQUE KEY `telegramId_18` (`telegramId`),
  ADD UNIQUE KEY `telegramId_19` (`telegramId`),
  ADD UNIQUE KEY `telegramId_20` (`telegramId`),
  ADD KEY `updatedBy` (`updatedBy`);

--
-- Indexes for table `user_update_logs`
--
ALTER TABLE `user_update_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userId` (`userId`),
  ADD KEY `performedBy` (`performedBy`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin_audit_logs`
--
ALTER TABLE `admin_audit_logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `food_category_update_logs`
--
ALTER TABLE `food_category_update_logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `food_update_logs`
--
ALTER TABLE `food_update_logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_update_logs`
--
ALTER TABLE `order_update_logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_update_logs`
--
ALTER TABLE `user_update_logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `admin_audit_logs`
--
ALTER TABLE `admin_audit_logs`
  ADD CONSTRAINT `admin_audit_logs_ibfk_1` FOREIGN KEY (`performedBy`) REFERENCES `admins` (`adminId`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `foods`
--
ALTER TABLE `foods`
  ADD CONSTRAINT `foods_ibfk_58` FOREIGN KEY (`categoryId`) REFERENCES `food_categories` (`categoryId`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `foods_ibfk_59` FOREIGN KEY (`createdBy`) REFERENCES `admins` (`adminId`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `foods_ibfk_60` FOREIGN KEY (`updatedBy`) REFERENCES `admins` (`adminId`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `food_categories`
--
ALTER TABLE `food_categories`
  ADD CONSTRAINT `food_categories_ibfk_1` FOREIGN KEY (`createdBy`) REFERENCES `admins` (`adminId`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `food_categories_ibfk_2` FOREIGN KEY (`updatedBy`) REFERENCES `admins` (`adminId`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `food_update_logs`
--
ALTER TABLE `food_update_logs`
  ADD CONSTRAINT `food_update_logs_ibfk_39` FOREIGN KEY (`foodId`) REFERENCES `foods` (`foodId`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `food_update_logs_ibfk_40` FOREIGN KEY (`performedBy`) REFERENCES `admins` (`adminId`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_73` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `orders_ibfk_74` FOREIGN KEY (`foodId`) REFERENCES `foods` (`foodId`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `orders_ibfk_75` FOREIGN KEY (`createdBy`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `orders_ibfk_76` FOREIGN KEY (`updatedBy`) REFERENCES `admins` (`adminId`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `order_update_logs`
--
ALTER TABLE `order_update_logs`
  ADD CONSTRAINT `order_update_logs_ibfk_37` FOREIGN KEY (`orderId`) REFERENCES `orders` (`orderId`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `order_update_logs_ibfk_38` FOREIGN KEY (`performedBy`) REFERENCES `admins` (`adminId`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`updatedBy`) REFERENCES `admins` (`adminId`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `user_update_logs`
--
ALTER TABLE `user_update_logs`
  ADD CONSTRAINT `user_update_logs_ibfk_39` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `user_update_logs_ibfk_40` FOREIGN KEY (`performedBy`) REFERENCES `admins` (`adminId`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

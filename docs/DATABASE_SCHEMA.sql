-- ============================================
-- Inventory Management System - Database Schema
-- ============================================

CREATE DATABASE IF NOT EXISTS inventory_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE inventory_db;

-- Users table
CREATE TABLE users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password      VARCHAR(255) NOT NULL,
  role          ENUM('admin', 'manager', 'staff') NOT NULL DEFAULT 'staff',
  isActive      BOOLEAN NOT NULL DEFAULT TRUE,
  lastLoginAt   DATETIME NULL,
  refreshToken  TEXT NULL,
  createdAt     DATETIME NOT NULL,
  updatedAt     DATETIME NOT NULL,
  INDEX idx_users_email (email),
  INDEX idx_users_role (role)
);

-- Categories table
CREATE TABLE categories (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT NULL,
  isActive    BOOLEAN NOT NULL DEFAULT TRUE,
  createdAt   DATETIME NOT NULL,
  updatedAt   DATETIME NOT NULL
);

-- Products table
CREATE TABLE products (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(200) NOT NULL,
  sku           VARCHAR(100) NOT NULL UNIQUE,
  description   TEXT NULL,
  categoryId    INT UNSIGNED NULL,
  unit          VARCHAR(50) NOT NULL DEFAULT 'pcs',
  costPrice     DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  sellingPrice  DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  reorderLevel  INT UNSIGNED NOT NULL DEFAULT 10,
  isActive      BOOLEAN NOT NULL DEFAULT TRUE,
  imageUrl      VARCHAR(500) NULL,
  createdAt     DATETIME NOT NULL,
  updatedAt     DATETIME NOT NULL,
  UNIQUE KEY sku_unique (sku),
  INDEX idx_products_category (categoryId),
  INDEX idx_products_active (isActive),
  CONSTRAINT fk_products_category
    FOREIGN KEY (categoryId) REFERENCES categories(id)
    ON UPDATE CASCADE ON DELETE SET NULL
);

-- Stocks table (one-to-one with products)
CREATE TABLE stocks (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  productId         INT UNSIGNED NOT NULL UNIQUE,
  quantity          INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reservedQuantity  INT UNSIGNED NOT NULL DEFAULT 0,
  lastRestockedAt   DATETIME NULL,
  createdAt         DATETIME NOT NULL,
  updatedAt         DATETIME NOT NULL,
  CONSTRAINT fk_stocks_product
    FOREIGN KEY (productId) REFERENCES products(id)
    ON UPDATE CASCADE ON DELETE CASCADE
);

-- Orders table
CREATE TABLE orders (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  orderNumber         VARCHAR(50) NOT NULL UNIQUE,
  userId              INT UNSIGNED NOT NULL,
  customerName        VARCHAR(150) NOT NULL,
  customerEmail       VARCHAR(150) NULL,
  customerPhone       VARCHAR(30) NULL,
  status              ENUM('pending','confirmed','processing','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
  totalAmount         DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  notes               TEXT NULL,
  cancelledAt         DATETIME NULL,
  cancellationReason  TEXT NULL,
  createdAt           DATETIME NOT NULL,
  updatedAt           DATETIME NOT NULL,
  INDEX idx_orders_user (userId),
  INDEX idx_orders_status (status),
  INDEX idx_orders_created (createdAt),
  CONSTRAINT fk_orders_user
    FOREIGN KEY (userId) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

-- Order Items table
CREATE TABLE order_items (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  orderId          INT UNSIGNED NOT NULL,
  productId        INT UNSIGNED NOT NULL,
  quantity         INT UNSIGNED NOT NULL,
  unitPrice        DECIMAL(15,2) NOT NULL,
  totalPrice       DECIMAL(15,2) NOT NULL,
  productSnapshot  JSON NULL COMMENT 'Snapshot of product at order time',
  createdAt        DATETIME NOT NULL,
  updatedAt        DATETIME NOT NULL,
  INDEX idx_order_items_order (orderId),
  INDEX idx_order_items_product (productId),
  CONSTRAINT fk_order_items_order
    FOREIGN KEY (orderId) REFERENCES orders(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product
    FOREIGN KEY (productId) REFERENCES products(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

-- Stock History table (audit trail - immutable)
CREATE TABLE stock_histories (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  productId        INT UNSIGNED NOT NULL,
  userId           INT UNSIGNED NULL,
  orderId          INT UNSIGNED NULL,
  movementType     ENUM('stock_in','stock_out','order_deduction','order_return','adjustment','initial') NOT NULL,
  quantityBefore   INT NOT NULL,
  quantityChanged  INT NOT NULL COMMENT 'Positive = increase, Negative = decrease',
  quantityAfter    INT NOT NULL,
  referenceNumber  VARCHAR(100) NULL,
  notes            TEXT NULL,
  createdAt        DATETIME NOT NULL,
  INDEX idx_sh_product (productId),
  INDEX idx_sh_user (userId),
  INDEX idx_sh_order (orderId),
  INDEX idx_sh_type (movementType),
  INDEX idx_sh_created (createdAt),
  CONSTRAINT fk_sh_product
    FOREIGN KEY (productId) REFERENCES products(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_sh_user
    FOREIGN KEY (userId) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_sh_order
    FOREIGN KEY (orderId) REFERENCES orders(id)
    ON UPDATE CASCADE ON DELETE SET NULL
);

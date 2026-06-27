# Inventory Management System

A full-stack Inventory Management System built with Node.js, Express, MySQL, Sequelize, JWT Authentication, and React.js.

## Features

- **JWT Authentication** with refresh tokens and role-based access (admin / manager / staff)
- **Product Management** with SKU uniqueness enforcement, categories, pricing
- **Stock Management** — add, remove, and adjust stock with full audit trail
- **Order Management** — place orders with automatic stock deduction via DB transactions
- **Order Cancellation** — automatically restores stock to pre-order levels
- **Stock History** — immutable audit log of every stock movement
- **Dashboard** — real-time stats: inventory levels, revenue, orders, low-stock alerts
- **Rate limiting**, helmet security headers, CORS, compression

---

## Project Structure

```
IMSA/
├── backend/
│   ├── src/
│   │   ├── config/          # App & DB configuration
│   │   ├── controllers/     # Request handlers
│   │   ├── database/
│   │   │   ├── migrations/  # Sequelize migrations
│   │   │   └── seeders/     # Seed data
│   │   ├── middleware/      # Auth, validation, error handling
│   │   ├── models/          # Sequelize models
│   │   ├── routes/          # Express routers
│   │   ├── services/        # Business logic layer
│   │   ├── utils/           # Helpers (logger, ApiResponse, AppError)
│   │   ├── validators/      # express-validator chains
│   │   ├── app.js           # Express app setup
│   │   └── server.js        # Entry point
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── layouts/         # App and Auth layouts
│   │   ├── lib/             # Axios instance with interceptors
│   │   ├── pages/           # Page-level components
│   │   ├── services/        # API service modules
│   │   ├── store/           # Zustand auth store
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
└── docs/
    ├── API_DOCUMENTATION.md
    ├── DATABASE_SCHEMA.sql
    └── postman_collection.json
```

---

## Setup Instructions

### Prerequisites
- Node.js >= 18
- MySQL 8.0+
- npm

---

### 1. Database Setup

```sql
CREATE DATABASE inventory_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env from example
copy .env.example .env
```

Edit `.env` with your database credentials:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=inventory_db
DB_USER=root
DB_PASSWORD=yourpassword

JWT_SECRET=your_super_secret_key_change_this
JWT_REFRESH_SECRET=your_refresh_secret_key_change_this

CORS_ORIGIN=http://localhost:3000
PORT=5000
NODE_ENV=development
```

Run migrations and seed data:

```bash
npm run db:migrate
npm run db:seed
```

Start the server:

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Backend runs on: `http://localhost:5000`

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs on: `http://localhost:3000`

---

## Default Login Credentials

| Role    | Email                     | Password   |
|---------|---------------------------|------------|
| Admin   | admin@inventory.com       | Admin@123  |
| Manager | manager@inventory.com     | Admin@123  |
| Staff   | staff@inventory.com       | Staff@123  |

---

## API Base URL

```
http://localhost:5000/api/v1
```

All protected routes require the header:
```
Authorization: Bearer <accessToken>
```

See [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) for full API reference.

---

## Role Permissions

| Action               | Admin | Manager | Staff |
|----------------------|-------|---------|-------|
| View products        | Yes    | Yes      | Yes   |
| Create/Edit products | Yes    | Yes      | NO    |
| Delete products      | Yes    | NO       | NO    |
| Add/Remove stock     | Yes    | Yes      | NO    |
| Adjust stock         | Yes    | NO       | NO    |
| Place orders         | Yes    | Yes      | Yes   |
| Update order status  | Yes    | Yes      | NO    |
| Cancel orders        | Yes    | Yes      | Yes   |
| Manage categories    | Yes    | Yes      | NO    |
| View dashboard       | Yes    | Yes      | Yes   |

---

## Business Rules Enforced

1. **Stock never goes negative** — validated in service layer + DB constraint
2. **Every stock movement creates a history record** — enforced in DB transaction
3. **Order placement deducts stock atomically** — single transaction for order + all items
4. **Order cancellation restores stock atomically** — single transaction for all items
5. **SKU uniqueness** — enforced at DB and application level
6. **JWT authentication** required for all protected routes
7. **DB transactions** used for all multi-step operations

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Backend    | Node.js, Express.js                 |
| Database   | MySQL 8 + Sequelize ORM             |
| Auth       | JWT (access + refresh tokens)       |
| Validation | express-validator                   |
| Logging    | Winston + daily rotate              |
| Frontend   | React 18, Vite                      |
| State      | Zustand (auth), React Query (data)  |
| Styling    | Tailwind CSS                        |
| Charts     | Recharts                            |
| HTTP       | Axios (with interceptors)           |

---

## Postman Collection

Import `docs/postman_collection.json` into Postman. The Login request auto-saves the token to the collection variable `accessToken`, which all other requests use automatically.

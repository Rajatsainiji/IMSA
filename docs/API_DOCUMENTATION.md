# Inventory Management System - API Documentation

**Base URL:** `http://localhost:5000/api/v1`  
**Authentication:** Bearer JWT token in `Authorization` header

---

## Authentication

### POST /auth/register
Register a new user.

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password1",
  "role": "staff"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": { "user": {...}, "accessToken": "...", "refreshToken": "..." }
}
```

---

### POST /auth/login
Login and receive tokens.

**Body:** `{ "email": "...", "password": "..." }`

---

### POST /auth/logout *(protected)*
Invalidate the current session.

---

### POST /auth/refresh-token
Get a new access token.

**Body:** `{ "refreshToken": "..." }`

---

### GET /auth/me *(protected)*
Get current user profile.

---

### PUT /auth/me *(protected)*
Update display name.

---

### PUT /auth/change-password *(protected)*
**Body:** `{ "currentPassword": "...", "newPassword": "..." }`

---

## Products

### GET /products *(protected)*
List products with pagination.

**Query params:** `page`, `limit`, `search`, `categoryId`, `isActive`, `sortBy`, `sortOrder`

---

### GET /products/low-stock *(protected)*
Get products at or below reorder level.

---

### GET /products/:id *(protected)*
Get single product with stock info.

---

### POST /products *(admin, manager)*
Create a product. A stock record is created automatically.

**Body:**
```json
{
  "name": "Wireless Mouse",
  "sku": "ELEC-MOU-001",
  "categoryId": 1,
  "unit": "pcs",
  "costPrice": 15.00,
  "sellingPrice": 29.99,
  "reorderLevel": 20
}
```

---

### PUT /products/:id *(admin, manager)*
Update product fields.

---

### DELETE /products/:id *(admin only)*
Soft-delete (deactivate) a product.

---

## Stock Management

### GET /stock/product/:productId *(protected)*
Get current stock for a product.

---

### POST /stock/product/:productId/add *(admin, manager)*
Add stock manually.

**Body:** `{ "quantity": 50, "notes": "Supplier delivery" }`

---

### POST /stock/product/:productId/remove *(admin, manager)*
Remove stock manually.

**Body:** `{ "quantity": 10, "notes": "Damaged goods" }`

---

### PUT /stock/product/:productId/adjust *(admin only)*
Set stock to an exact quantity.

**Body:** `{ "newQuantity": 100, "notes": "Inventory count correction" }`

---

### GET /stock/product/:productId/history *(protected)*
Get movement history for a single product.

**Query params:** `page`, `limit`, `movementType`

---

### GET /stock/history *(protected)*
Get system-wide stock movement history.

**Query params:** `page`, `limit`, `movementType`, `productId`

---

## Orders

### GET /orders *(protected)*
List orders with filters.

**Query params:** `page`, `limit`, `status`, `search`, `startDate`, `endDate`

---

### GET /orders/stats *(protected)*
Get order count by status and total revenue.

---

### GET /orders/:id *(protected)*
Get full order with items.

---

### POST /orders *(protected)*
Place a new order. Stock is deducted atomically.

**Body:**
```json
{
  "customerName": "Alice Smith",
  "customerEmail": "alice@example.com",
  "customerPhone": "+1 555 0001",
  "items": [
    { "productId": 1, "quantity": 2 },
    { "productId": 3, "quantity": 5 }
  ],
  "notes": "Urgent delivery"
}
```

**Business rules enforced:**
- Stock cannot go negative
- All stock deductions happen in a single DB transaction

---

### PUT /orders/:id/status *(admin, manager)*
Advance order status.

**Body:** `{ "status": "confirmed" }`

**Valid transitions:**
- pending → confirmed | cancelled
- confirmed → processing | cancelled
- processing → shipped | cancelled
- shipped → delivered

---

### PUT /orders/:id/cancel *(protected)*
Cancel order and automatically restore stock.

**Body:** `{ "reason": "Customer requested cancellation" }`

---

## Categories

### GET /categories *(protected)*
List all active categories.

### POST /categories *(admin, manager)*
**Body:** `{ "name": "Electronics", "description": "..." }`

### PUT /categories/:id *(admin, manager)*
### DELETE /categories/:id *(admin only)*

---

## Dashboard

### GET /dashboard/summary *(protected)*
Returns inventory stats, order counts, and revenue summary.

### GET /dashboard/top-products *(protected)*
**Query params:** `limit` (default: 10)

---

## Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    { "field": "email", "message": "Must be a valid email address" }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### HTTP Status Codes
| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized (no/invalid token) |
| 403 | Forbidden (insufficient role) |
| 404 | Not Found |
| 409 | Conflict (duplicate SKU, etc.) |
| 422 | Validation Error |
| 429 | Rate Limited |
| 500 | Internal Server Error |

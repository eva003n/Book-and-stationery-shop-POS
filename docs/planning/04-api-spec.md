# API Specification
## Duka POS — Point of Sale System for Book & Stationery Retail (Kenya)

**Version:** 1.0.0  
**Date:** 2026-04-30  
**Status:** Draft for Review  
**Base URL:** `https://api.dukapos.co.ke/v1`  
**Protocol:** HTTPS only. TLS 1.3.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Authentication](#2-authentication)
3. [Common Conventions](#3-common-conventions)
4. [Auth Endpoints](#4-auth-endpoints)
5. [Products Endpoints](#5-products-endpoints)
6. [Inventory Endpoints](#6-inventory-endpoints)
7. [Transactions Endpoints](#7-transactions-endpoints)
8. [M-Pesa Endpoints](#8-m-pesa-endpoints)
9. [eTIMS Endpoints](#9-etims-endpoints)
10. [Shifts Endpoints](#10-shifts-endpoints)
11. [Reports Endpoints](#11-reports-endpoints)
12. [Users Endpoints](#12-users-endpoints)
13. [Sync Endpoints](#13-sync-endpoints)
14. [WebSocket Events](#14-websocket-events)
15. [Error Reference](#15-error-reference)

---

## 1. Overview

### 1.1 API Style

REST with JSON request/response bodies. WebSocket for real-time events (M-Pesa callbacks, sync notifications).

### 1.2 Versioning

URL path versioning: `/v1/`. Breaking changes increment the version. Non-breaking additions (new fields, new optional params) are made within the same version.

### 1.3 Rate Limits

| Tier | Limit | Window |
|---|---|---|
| Standard (per IP) | 100 requests | 1 minute |
| Auth endpoints | 10 requests | 1 minute |
| M-Pesa STK push | 20 requests | 1 minute |
| Sync endpoints | 200 requests | 1 minute |

Rate limit headers are returned on every response:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1746007200
```

### 1.4 Pagination

All list endpoints support cursor-based pagination:

```
GET /v1/products?cursor=<opaque_cursor>&limit=50
```

Response includes:
```json
{
  "data": [...],
  "meta": {
    "count": 50,
    "nextCursor": "eyJpZCI6IjEyMyJ9",
    "hasMore": true
  }
}
```

---

## 2. Authentication

### 2.1 Tokens

**Access Token:** JWT, 15-minute expiry. Required on all protected endpoints via `Authorization: Bearer <token>`.

**Refresh Token:** Opaque token, 7-day expiry. Rotated on each use. Stored as `HttpOnly` cookie or in secure local storage.

### 2.2 PIN Authentication (POS)

POS cashiers authenticate with a PIN. The API issues the same JWT/refresh token pair. PIN is bcrypt-hashed; never stored or transmitted in plaintext.

### 2.3 Required Headers

```
Authorization: Bearer <access_token>
Content-Type: application/json
X-Branch-ID: <branch_uuid>        (required on most endpoints)
X-Device-ID: <device_uuid>        (required for offline sync)
```

---

## 3. Common Conventions

### 3.1 Request / Response Format

All requests and responses use `application/json`.

Timestamps are ISO 8601 with timezone: `2026-04-30T14:32:00+03:00`

UUIDs are lowercase hyphenated: `550e8400-e29b-41d4-a716-446655440000`

Monetary amounts are strings with 2 decimal places: `"1089.00"` — avoids floating point precision issues.

### 3.2 Success Response Envelope

```json
{
  "success": true,
  "data": { ... },
  "meta": { ... }
}
```

### 3.3 Error Response Envelope

```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "No product found with barcode 9780199535569",
    "details": { ... }
  }
}
```

### 3.4 HTTP Status Codes

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 204 | No content (successful delete) |
| 400 | Bad request — validation error |
| 401 | Unauthorised — missing/invalid token |
| 403 | Forbidden — insufficient permissions |
| 404 | Not found |
| 409 | Conflict — e.g. duplicate SKU |
| 422 | Unprocessable entity — business logic error |
| 429 | Too many requests |
| 500 | Internal server error |
| 503 | Service unavailable (external dependency down) |

---

## 4. Auth Endpoints

### POST /auth/login

Authenticate with email/password (manager, admin) or user ID + PIN (cashier).

**Request:**
```json
{
  "type": "pin",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "pin": "1234"
}
```
or
```json
{
  "type": "password",
  "email": "manager@dukabooks.co.ke",
  "password": "s3cur3P@ssword"
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
    "refreshToken": "rt_abc123def456",
    "expiresIn": 900,
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Amina Wanjiku",
      "role": "cashier",
      "branchId": "branch-uuid"
    }
  }
}
```

**Errors:**
- `401 INVALID_CREDENTIALS` — wrong PIN or password
- `403 ACCOUNT_LOCKED` — too many failed attempts
- `403 ACCOUNT_INACTIVE` — user disabled

---

### POST /auth/refresh

Exchange a refresh token for a new access token.

**Request:**
```json
{
  "refreshToken": "rt_abc123def456"
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
    "refreshToken": "rt_newtoken789",
    "expiresIn": 900
  }
}
```

---

### POST /auth/logout

Revoke the current refresh token.

**Request:** Empty body. Requires `Authorization` header.

**Response `204`:** No content.

---

## 5. Products Endpoints

### GET /products

List products. Supports search, filter, and pagination.

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `q` | string | Search by name, SKU, or barcode |
| `barcode` | string | Exact barcode / ISBN lookup |
| `categoryId` | UUID | Filter by category |
| `inStock` | boolean | Only products with stock > 0 |
| `limit` | integer | Page size (default 50, max 200) |
| `cursor` | string | Pagination cursor |

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "prod-uuid",
      "sku": "BK-001234",
      "barcode": "9780199535569",
      "name": "Oxford English Dictionary (Pocket Edition)",
      "author": "Oxford University Press",
      "category": { "id": "cat-uuid", "name": "Books" },
      "sellingPrice": "850.00",
      "vatRate": "16.00",
      "vatType": "standard",
      "unit": "each",
      "stockLevel": {
        "quantity": "12.000",
        "reorderLevel": "5.000"
      },
      "isActive": true
    }
  ],
  "meta": {
    "count": 1,
    "nextCursor": null,
    "hasMore": false
  }
}
```

---

### POST /products

Create a new product. Requires `admin` or `manager` role.

**Request:**
```json
{
  "sku": "ST-00456",
  "barcode": "6001233456780",
  "name": "Ballpoint Pen Blue (Box of 50)",
  "categoryId": "cat-stationery-uuid",
  "buyingPrice": "150.00",
  "sellingPrice": "250.00",
  "vatType": "standard",
  "unit": "box",
  "reorderLevel": 10
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "new-prod-uuid",
    "sku": "ST-00456",
    ...
  }
}
```

**Errors:**
- `409 DUPLICATE_SKU` — SKU already exists in this organisation
- `409 DUPLICATE_BARCODE` — barcode already assigned to another product
- `400 INVALID_VAT_TYPE` — must be `standard`, `zero`, or `exempt`

---

### GET /products/:id

Get a single product by ID.

**Response `200`:** Full product object including stock levels and recent price history.

---

### PATCH /products/:id

Update product fields. Partial update — only send fields to change.

**Request:**
```json
{
  "sellingPrice": "275.00",
  "reorderLevel": 15
}
```

**Response `200`:** Updated product object.

---

### POST /products/import

Bulk import products from CSV. Async job — returns a job ID.

**Request:** `multipart/form-data` with field `file` (CSV).

**CSV format:**
```
sku,barcode,name,category,buyingPrice,sellingPrice,vatType,unit,reorderLevel
BK-001,9780199535569,Oxford English Dict,Books,600.00,850.00,standard,each,5
```

**Response `202`:**
```json
{
  "success": true,
  "data": {
    "jobId": "import-job-uuid",
    "status": "queued",
    "statusUrl": "/v1/jobs/import-job-uuid"
  }
}
```

---

### GET /products/barcode/:barcode

Fast barcode lookup — optimised for POS scan path. Returns in < 50ms from cache.

**Response `200`:** Product object with current stock level.

**Response `404`:**
```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "No product found with barcode 9780199535569"
  }
}
```

---

## 6. Inventory Endpoints

### GET /inventory/stock

Get current stock levels, optionally filtered.

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `branchId` | UUID | Required |
| `lowStock` | boolean | Only items at or below reorder level |
| `categoryId` | UUID | Filter by category |

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "productId": "prod-uuid",
      "productName": "Oxford English Dictionary",
      "sku": "BK-001234",
      "quantity": "12.000",
      "reorderLevel": "5.000",
      "isLowStock": false,
      "stockValue": {
        "atCost": "7200.00",
        "atSelling": "10200.00"
      }
    }
  ]
}
```

---

### POST /inventory/adjustments

Record a manual stock adjustment.

**Request:**
```json
{
  "productId": "prod-uuid",
  "branchId": "branch-uuid",
  "adjustmentType": "remove",
  "quantity": "3.000",
  "reason": "damage",
  "notes": "Water damage from roof leak"
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "adj-uuid",
    "previousQuantity": "12.000",
    "newQuantity": "9.000",
    "adjustedBy": "user-uuid",
    "createdAt": "2026-04-30T14:32:00+03:00"
  }
}
```

---

### POST /inventory/grn

Record a Goods Received Note.

**Request:**
```json
{
  "branchId": "branch-uuid",
  "supplierId": "supplier-uuid",
  "referenceNo": "INV-2026-0045",
  "lines": [
    {
      "productId": "prod-uuid",
      "quantity": "50.000",
      "unitCost": "600.00"
    },
    {
      "productId": "prod-uuid-2",
      "quantity": "200.000",
      "unitCost": "12.00"
    }
  ],
  "notes": "Partial delivery — remaining 20 copies expected next week"
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "grn-uuid",
    "referenceNo": "INV-2026-0045",
    "totalLines": 2,
    "totalUnitsReceived": 250,
    "totalCostValue": "32400.00",
    "createdAt": "2026-04-30T14:32:00+03:00"
  }
}
```

---

### GET /inventory/grn

List GRNs with optional filters.

**Query Parameters:** `supplierId`, `dateFrom`, `dateTo`, `limit`, `cursor`

---

### GET /inventory/grn/:id

Get a single GRN with all line items.

---

## 7. Transactions Endpoints

### POST /transactions

Create and complete a transaction. This is the primary POS checkout endpoint.

**Request:**
```json
{
  "shiftId": "shift-uuid",
  "branchId": "branch-uuid",
  "lines": [
    {
      "productId": "prod-uuid-1",
      "quantity": "1.000",
      "unitPrice": "850.00",
      "discountPct": "0.00"
    },
    {
      "productId": "prod-uuid-2",
      "quantity": "3.000",
      "unitPrice": "30.00",
      "discountPct": "0.00"
    }
  ],
  "payment": {
    "method": "split",
    "cashAmount": "500.00",
    "mpesaAmount": "440.00",
    "mpesaRef": "QHJ4X89P",
    "mpesaPhone": "254722000000",
    "cashTendered": "500.00"
  },
  "customerPhone": "254722000000",
  "customerEmail": null
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "txn-uuid",
    "transactionNo": "TXN-20260430-00042",
    "status": "completed",
    "lines": [
      {
        "productId": "prod-uuid-1",
        "productName": "Oxford English Dictionary",
        "sku": "BK-001234",
        "quantity": "1.000",
        "unitPrice": "850.00",
        "vatRate": "16.00",
        "vatType": "standard",
        "lineTotal": "850.00"
      }
    ],
    "subtotal": "940.00",
    "discountAmount": "0.00",
    "vatAmount": "130.34",
    "total": "940.00",
    "payment": {
      "method": "split",
      "cashAmount": "500.00",
      "mpesaAmount": "440.00",
      "mpesaRef": "QHJ4X89P",
      "changeGiven": "0.00"
    },
    "etims": {
      "invoiceNo": "INV-2026-00042",
      "qrCode": "data:image/png;base64,...",
      "status": "submitted"
    },
    "receipt": {
      "printUrl": "/v1/transactions/txn-uuid/receipt.pdf",
      "smsQueued": false
    },
    "createdAt": "2026-04-30T14:32:00+03:00"
  }
}
```

**Errors:**
- `422 INSUFFICIENT_STOCK` — one or more items not in stock
- `422 PAYMENT_MISMATCH` — payment amounts don't sum to transaction total
- `422 NO_ACTIVE_SHIFT` — no open shift for this cashier
- `409 DUPLICATE_MPESA_REF` — M-Pesa reference already used in another transaction

---

### GET /transactions

List transactions with filters.

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `shiftId` | UUID | Filter by shift |
| `cashierId` | UUID | Filter by cashier |
| `dateFrom` | ISO date | Start date |
| `dateTo` | ISO date | End date |
| `status` | string | `completed`, `voided`, `held` |
| `paymentMethod` | string | `cash`, `mpesa`, `split` |
| `q` | string | Search by transaction number |
| `limit` | integer | Default 50 |
| `cursor` | string | Pagination cursor |

**Response `200`:** Array of transaction summary objects.

---

### GET /transactions/:id

Get full transaction detail including line items and eTIMS data.

---

### POST /transactions/:id/void

Void a completed transaction. Requires `manager` or `admin` role.

**Request:**
```json
{
  "reason": "wrong_item",
  "notes": "Cashier scanned wrong barcode",
  "managerPin": "5678"
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "voidId": "void-uuid",
    "originalTransactionId": "txn-uuid",
    "voidedAt": "2026-04-30T15:00:00+03:00",
    "voidedBy": "manager-uuid"
  }
}
```

**Errors:**
- `403 INSUFFICIENT_ROLE` — cashier role cannot void
- `403 INVALID_MANAGER_PIN` — wrong manager PIN
- `422 ALREADY_VOIDED` — transaction already voided

---

### POST /transactions/:id/hold

Place a transaction on hold.

**Response `200`:** Transaction with `status: "held"`.

---

### POST /transactions/:id/resume

Resume a held transaction (re-activates it in the POS cart).

---

### GET /transactions/:id/receipt

Get the receipt as a PDF (for reprinting).

**Response:** `application/pdf`

---

### POST /transactions/:id/receipt/send

Send receipt via SMS or email.

**Request:**
```json
{
  "channel": "sms",
  "destination": "254722000000"
}
```
or
```json
{
  "channel": "email",
  "destination": "customer@example.com"
}
```

**Response `202`:**
```json
{
  "success": true,
  "data": {
    "queued": true,
    "channel": "sms",
    "destination": "254722000000"
  }
}
```

---

## 8. M-Pesa Endpoints

### POST /mpesa/stk-push

Initiate an M-Pesa STK Push payment request.

**Request:**
```json
{
  "phoneNumber": "254722000000",
  "amount": "940",
  "transactionRef": "TXN-20260430-00042",
  "description": "Payment at Duka Books"
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "checkoutRequestId": "ws_CO_30042026143200000001",
    "merchantRequestId": "12345-67890-1",
    "responseCode": "0",
    "customerMessage": "Success. Request accepted for processing"
  }
}
```

**Errors:**
- `503 MPESA_UNAVAILABLE` — Daraja API unreachable
- `400 INVALID_PHONE` — phone number format rejected by Daraja
- `422 AMOUNT_TOO_LOW` — below Safaricom minimum (KES 1)

---

### POST /mpesa/callback

Safaricom Daraja result callback. **Not authenticated** — this endpoint is called by Safaricom's servers.

> Security: This endpoint is IP-whitelisted to Safaricom's published IP ranges. No Bearer token is required.

**Request (from Safaricom):**
```json
{
  "Body": {
    "stkCallback": {
      "MerchantRequestID": "12345-67890-1",
      "CheckoutRequestID": "ws_CO_30042026143200000001",
      "ResultCode": 0,
      "ResultDesc": "The service request is processed successfully.",
      "CallbackMetadata": {
        "Item": [
          { "Name": "Amount", "Value": 940 },
          { "Name": "MpesaReceiptNumber", "Value": "QHJ4X89P" },
          { "Name": "TransactionDate", "Value": 20260430143215 },
          { "Name": "PhoneNumber", "Value": 254722000000 }
        ]
      }
    }
  }
}
```

**Response `200`:**
```json
{
  "ResultCode": 0,
  "ResultDesc": "Accepted"
}
```

> Always return `200` immediately. Processing happens asynchronously.

---

### GET /mpesa/status/:checkoutRequestId

Poll for M-Pesa payment status. Used as fallback if WebSocket is unavailable.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "checkoutRequestId": "ws_CO_30042026143200000001",
    "status": "confirmed",
    "mpesaRef": "QHJ4X89P",
    "amount": "940.00",
    "phone": "254722000000",
    "confirmedAt": "2026-04-30T14:32:15+03:00"
  }
}
```

**Status values:** `pending` | `confirmed` | `failed` | `cancelled`

---

### GET /mpesa/reconciliation

Get M-Pesa collections for reconciliation, grouped by day.

**Query Parameters:** `dateFrom`, `dateTo`, `branchId`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "period": { "from": "2026-04-01", "to": "2026-04-30" },
    "summary": {
      "totalTransactions": 312,
      "totalAmount": "487250.00",
      "avgTransaction": "1562.34"
    },
    "daily": [
      {
        "date": "2026-04-30",
        "count": 28,
        "total": "43500.00"
      }
    ]
  }
}
```

---

## 9. eTIMS Endpoints

### GET /etims/status

Get eTIMS submission queue status.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "pendingSubmissions": 0,
    "failedSubmissions": 2,
    "lastSubmittedAt": "2026-04-30T14:30:00+03:00",
    "apiStatus": "online"
  }
}
```

---

### POST /etims/retry-failed

Manually trigger retry of failed eTIMS submissions. Requires `admin` role.

**Response `202`:**
```json
{
  "success": true,
  "data": {
    "retriesQueued": 2
  }
}
```

---

### GET /etims/report

Daily eTIMS submission report for compliance.

**Query Parameters:** `date` (ISO date, required)

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "date": "2026-04-30",
    "totalInvoices": 85,
    "submitted": 85,
    "pending": 0,
    "failed": 0,
    "vatSummary": {
      "standardRated": "42300.00",
      "zeroRated": "3200.00",
      "exempt": "1500.00",
      "totalVat": "5849.66"
    }
  }
}
```

---

## 10. Shifts Endpoints

### POST /shifts

Open a new shift.

**Request:**
```json
{
  "branchId": "branch-uuid",
  "cashierId": "user-uuid",
  "openingFloat": "2000.00"
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "shift-uuid",
    "status": "open",
    "openedAt": "2026-04-30T08:00:00+03:00",
    "openingFloat": "2000.00"
  }
}
```

**Errors:**
- `409 SHIFT_ALREADY_OPEN` — cashier has an unclosed shift

---

### PATCH /shifts/:id/close

Close a shift and generate the Z-Report.

**Request:**
```json
{
  "closingFloat": "3450.00",
  "cashCounted": {
    "1000": 2,
    "500": 1,
    "200": 3,
    "100": 2,
    "50": 3,
    "40": 0,
    "20": 5,
    "10": 10,
    "5": 5
  }
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "shiftId": "shift-uuid",
    "status": "closed",
    "closedAt": "2026-04-30T18:00:00+03:00",
    "zReport": {
      "openingFloat": "2000.00",
      "cashSales": "18500.00",
      "mpesaSales": "24750.00",
      "totalSales": "43250.00",
      "totalTransactions": 56,
      "refunds": "850.00",
      "discountsGiven": "1200.00",
      "vatCollected": "5380.17",
      "netRevenue": "41200.00",
      "expectedCash": "20500.00",
      "actualCash": "20450.00",
      "cashVariance": "-50.00",
      "reportUrl": "/v1/shifts/shift-uuid/zreport.pdf"
    }
  }
}
```

---

### GET /shifts/:id/zreport

Download Z-Report PDF.

**Response:** `application/pdf`

---

### GET /shifts

List shifts with filters.

**Query Parameters:** `branchId`, `cashierId`, `dateFrom`, `dateTo`, `status`

---

## 11. Reports Endpoints

### GET /reports/dashboard

Real-time KPI summary for manager dashboard.

**Query Parameters:** `branchId`, `date` (defaults to today)

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "date": "2026-04-30",
    "revenue": {
      "today": "43250.00",
      "yesterday": "38900.00",
      "changePercent": "11.2"
    },
    "transactions": {
      "today": 56,
      "yesterday": 48
    },
    "paymentSplit": {
      "cash": "18500.00",
      "mpesa": "24750.00"
    },
    "topProducts": [
      {
        "productId": "prod-uuid",
        "name": "Oxford English Dictionary",
        "unitsSold": 8,
        "revenue": "6800.00"
      }
    ],
    "lowStockAlerts": 3,
    "hourly": [
      { "hour": "08:00", "revenue": "2300.00", "count": 6 },
      { "hour": "09:00", "revenue": "5100.00", "count": 12 }
    ]
  }
}
```

---

### GET /reports/sales

Sales summary report with grouping.

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `branchId` | UUID | Required |
| `dateFrom` | ISO date | Required |
| `dateTo` | ISO date | Required |
| `groupBy` | string | `day`, `week`, `month`, `cashier`, `category` |
| `categoryId` | UUID | Filter by category |
| `cashierId` | UUID | Filter by cashier |
| `paymentMethod` | string | Filter by method |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRevenue": "487250.00",
      "totalTransactions": 612,
      "totalVat": "60430.17",
      "totalDiscounts": "12300.00"
    },
    "groups": [
      {
        "label": "2026-04-30",
        "revenue": "43250.00",
        "transactions": 56,
        "vat": "5380.17"
      }
    ]
  }
}
```

---

### GET /reports/sales/export

Export sales report. Returns file download.

**Query Parameters:** Same as `/reports/sales` + `format=pdf|csv`

**Response:** `application/pdf` or `text/csv`

---

### GET /reports/inventory

Inventory valuation report.

**Query Parameters:** `branchId`, `categoryId`, `lowStockOnly`

---

### GET /reports/products/performance

Product performance: units sold, revenue, margin per product.

**Query Parameters:** `branchId`, `dateFrom`, `dateTo`, `limit` (default 50)

---

## 12. Users Endpoints

### GET /users

List users. Requires `admin` role.

**Response `200`:** Array of user objects (no PIN hash returned).

---

### POST /users

Create a new user. Requires `admin` role.

**Request:**
```json
{
  "name": "Amina Wanjiku",
  "role": "cashier",
  "branchId": "branch-uuid",
  "pin": "1234",
  "email": null
}
```

**Response `201`:** User object.

---

### PATCH /users/:id

Update user details (name, role, PIN, branch, active status).

**Request:** Partial — only include fields to change.

---

### DELETE /users/:id

Deactivate a user (soft delete — sets `isActive: false`). Requires `admin` role.

**Response `204`:** No content.

---

### GET /users/:id/audit

Get audit log entries for a specific user.

**Query Parameters:** `dateFrom`, `dateTo`, `limit`

---

## 13. Sync Endpoints

### POST /sync/batch

Upload a batch of offline-created records for server sync.

**Request:**
```json
{
  "deviceId": "device-uuid",
  "records": [
    {
      "id": "local-uuid-1",
      "operation": "INSERT",
      "table": "transactions",
      "payload": { ... },
      "localTimestamp": "2026-04-30T14:32:00+03:00"
    },
    {
      "id": "local-uuid-2",
      "operation": "INSERT",
      "table": "transaction_lines",
      "payload": { ... },
      "localTimestamp": "2026-04-30T14:32:00+03:00"
    }
  ]
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "processed": 2,
    "failed": 0,
    "results": [
      {
        "localId": "local-uuid-1",
        "serverId": "server-uuid-1",
        "status": "synced"
      }
    ]
  }
}
```

---

### GET /sync/pull

Pull server-side changes since last sync (for delta sync of products, prices, etc.).

**Query Parameters:** `since` (ISO timestamp of last successful pull)

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "since": "2026-04-29T18:00:00+03:00",
    "until": "2026-04-30T14:32:00+03:00",
    "changes": {
      "products": [ { "id": "...", "sellingPrice": "875.00", "_deleted": false } ],
      "categories": [],
      "users": []
    }
  }
}
```

---

## 14. WebSocket Events

**WebSocket URL:** `wss://api.dukapos.co.ke/v1/ws`

**Authentication:** Pass JWT in connection query param: `?token=<access_token>`

**Message format:**
```json
{
  "event": "event_name",
  "data": { ... },
  "timestamp": "2026-04-30T14:32:00+03:00"
}
```

### 14.1 Events from Server → Client

| Event | Trigger | Data |
|---|---|---|
| `mpesa.pending` | STK push sent | `{ checkoutRequestId, phone, amount }` |
| `mpesa.confirmed` | Customer paid | `{ checkoutRequestId, mpesaRef, amount, phone }` |
| `mpesa.failed` | Customer cancelled / timeout | `{ checkoutRequestId, reason }` |
| `stock.low_alert` | Item hits reorder level | `{ productId, productName, quantity, reorderLevel }` |
| `sync.completed` | Offline batch sync processed | `{ recordsSynced, errors }` |
| `shift.closed` | Manager closes shift | `{ shiftId, zReportUrl }` |

### 14.2 Events from Client → Server

| Event | Purpose | Data |
|---|---|---|
| `mpesa.subscribe` | Subscribe to STK push updates | `{ checkoutRequestId }` |
| `mpesa.unsubscribe` | Stop listening | `{ checkoutRequestId }` |
| `ping` | Keep-alive | `{}` |

---

## 15. Error Reference

### Error Codes

| Code | HTTP Status | Description |
|---|---|---|
| `INVALID_CREDENTIALS` | 401 | Wrong PIN or password |
| `TOKEN_EXPIRED` | 401 | Access token has expired |
| `TOKEN_INVALID` | 401 | Token signature invalid |
| `ACCOUNT_LOCKED` | 403 | Too many failed login attempts |
| `ACCOUNT_INACTIVE` | 403 | User account disabled |
| `INSUFFICIENT_ROLE` | 403 | Action requires higher role |
| `INVALID_MANAGER_PIN` | 403 | Manager override PIN incorrect |
| `PRODUCT_NOT_FOUND` | 404 | No product matches query |
| `TRANSACTION_NOT_FOUND` | 404 | Transaction ID not found |
| `SHIFT_NOT_FOUND` | 404 | Shift ID not found |
| `DUPLICATE_SKU` | 409 | SKU already exists |
| `DUPLICATE_BARCODE` | 409 | Barcode assigned to another product |
| `DUPLICATE_MPESA_REF` | 409 | M-Pesa reference already recorded |
| `SHIFT_ALREADY_OPEN` | 409 | Cashier has unclosed shift |
| `ALREADY_VOIDED` | 422 | Transaction already voided |
| `INSUFFICIENT_STOCK` | 422 | Item quantity exceeds stock |
| `PAYMENT_MISMATCH` | 422 | Payments don't sum to total |
| `NO_ACTIVE_SHIFT` | 422 | No open shift for this cashier |
| `INVALID_VAT_TYPE` | 400 | VAT type must be standard/zero/exempt |
| `INVALID_PHONE` | 400 | Phone number format invalid |
| `AMOUNT_TOO_LOW` | 422 | Below minimum transaction amount |
| `MPESA_UNAVAILABLE` | 503 | Safaricom Daraja API unreachable |
| `ETIMS_UNAVAILABLE` | 503 | KRA eTIMS API unreachable |
| `PRINTER_UNAVAILABLE` | 503 | Printer not connected or paper out |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

### Validation Error Format

For `400` responses with field-level validation errors:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "fields": [
        {
          "field": "phoneNumber",
          "message": "Must be a valid Kenyan phone number (07XX or +254XX format)"
        },
        {
          "field": "amount",
          "message": "Must be a positive integer"
        }
      ]
    }
  }
}
```

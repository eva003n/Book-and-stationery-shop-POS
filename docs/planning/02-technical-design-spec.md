# Technical & Design Specification
## Duka POS — Point of Sale System for Book & Stationery Retail (Kenya)

**Version:** 1.0.0  
**Date:** 2026-04-30  
**Status:** Draft for Review  
**Owner:** Engineering Team

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Technology Stack](#2-technology-stack)
3. [Data Models](#3-data-models)
4. [Offline-First Architecture](#4-offline-first-architecture)
5. [M-Pesa Integration Architecture](#5-m-pesa-integration-architecture)
6. [KRA eTIMS Integration Architecture](#6-kra-etims-integration-architecture)
7. [Security Architecture](#7-security-architecture)
8. [Infrastructure & Deployment](#8-infrastructure--deployment)
9. [Design System](#9-design-system)
10. [Component Architecture](#10-component-architecture)
11. [Performance Requirements](#11-performance-requirements)
12. [Testing Strategy](#12-testing-strategy)

---

## 1. System Architecture

### 1.1 High-Level Overview

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  POS App    │  │ Manager App │  │  Admin App  │    │
│  │ (React PWA) │  │ (React PWA) │  │ (React PWA) │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
│         │                │                │            │
│  ┌──────┴────────────────┴────────────────┴──────┐     │
│  │           Local SQLite (IndexedDB/SQLite)      │     │
│  │              Offline-first cache               │     │
│  └──────────────────────┬────────────────────────┘     │
└─────────────────────────┼───────────────────────────────┘
                          │ HTTPS / SSE
┌─────────────────────────┼───────────────────────────────┐
│                     API LAYER                       
│  ┌───────────────────────────────────────────────┐      │
│  │         Node.js / Express API Server           │      │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐  │      │
│  │  │  Auth    │ │  Sales   │ │  Inventory   │  │      │
│  │  │ Service  │ │ Service  │ │   Service    │  │      │
│  │  └──────────┘ └──────────┘ └──────────────┘  │      │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐  │      │
│  │  │ M-Pesa   │ │  eTIMS   │ │  Reporting   │  │      │
│  │  │ Service  │ │ Service  │ │   Service    │  │      │
│  │  └──────────┘ └──────────┘ └──────────────┘  │      │
│  └───────────────────────┬───────────────────────┘      │
└──────────────────────────┼──────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────┐
│                    DATA LAYER                             │
│  ┌────────────────┐  ┌───────────────┐                  │
│  │  PostgreSQL    │  │     Redis      │                  │
│  │  (Primary DB)  │  │(Cache/Task Queue) │                  │
│  └────────────────┘  └───────────────┘                  │
└─────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────┐
│               EXTERNAL SERVICES                          │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │ Safaricom  │  │  KRA eTIMS   │  │ Africa's Talking │ │
│  │   Daraja   │  │     API      │  │   (SMS/USSD)    │ │
│  └────────────┘  └──────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Deployment Topology

Each shop installation has:

- **1 x Server node** — can be a Raspberry Pi 4 (local), cloud VM, or both in hybrid mode
- **1–5 x POS terminals** — Android tablets or Windows PCs running the PWA
- **1 x Thermal receipt printer** per till (ESC/POS over USB or Bluetooth)
- **Optional: Customer-facing display** (second screen or dedicated tablet)

---

## 2. Technology Stack

### 2.1 Frontend

| Concern | Technology | Rationale |
|---|---|---|
| UI Framework | React 19 + TypeScript 5 | Component reusability across POS, Manager, Admin views |
| State Management | Zustand | Lightweight; works well with offline-first patterns |
| Styling | Tailwind CSS | Rapid UI development; consistent design tokens |
| PWA / Offline | Workbox + Service Workers | Background sync, offline caching |
| Local DB | SQLite via `sql.js` + `@sqlite.org/sqlite-wasm` | Full SQL offline; syncs to PostgreSQL |
| Barcode scanning | `@zxing/browser` | Camera-based scanning; also handles ISBN-13 |
| Receipt printing | `escpos-buffer` | ESC/POS command generation for thermal printers |
| Forms | React Hook Form + Zod | Type-safe validation |
| Charts | Recharts | Reporting dashboard visualisations |

#### Resources
##### Service workers
- [MDN service worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Workbox](https://developer.chrome.com/docs/workbox)
- [Vite plugin pwa](https://github.com/vite-pwa/vite-plugin-pwa)
- [PWA by web.dev](https://web.dev/learn/pwa/getting-started?continue=https%3A%2F%2Fweb.dev%2Flearn%2Fpwa%2F%23article-https%3A%2F%2Fweb.dev%2Flearn%2Fpwa%2Fgetting-started)

### 2.2 Backend

| Concern | Technology | Rationale |
|---|---|---|
| Runtime | Node.js 20 LTS | Familiar ecosystem; good async I/O for payment polling |
| Framework | Express 5 | Minimal overhead; easy to reason about |
| Language | JS + TypeScript | End-to-end type safety with shared types package |
| ORM | Prisma | Schema-first; excellent migration tooling |
| Primary Database | PostgreSQL 16 | ACID compliance; JSON columns for receipt data |
| Cache / Queues | Redis 7 | M-Pesa callback queuing; session storage; rate limiting |
| Job Queue | BullMQ (Redis-backed) | eTIMS transmission queue; SMS queue |
| Auth | JWT (access) + refresh tokens | Stateless; works offline |
| API Style | REST  | REST for CRUD; SSE(Server sent events) for real-time M-Pesa status |

### 2.3 Infrastructure

| Concern | Technology |
|---|---|
| Cloud Provider | Railway.app or Render (low-cost, East Africa latency acceptable) |
| Containerisation | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Monitoring | Sentry (errors) + Uptime Robot (availability) |
| Logging | Winston → file + optional LogDNA |
| Backups | pg_dump to S3-compatible (Cloudflare R2) — daily |
<!-- | CDN | Cloudflare | -->

---

## 3. Data Models

### 3.1 Core Schema (PostgreSQL)

```sql
-- Organisations (multi-tenant root)
CREATE TABLE organisations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  kra_pin     TEXT NOT NULL UNIQUE,
  mpesa_till  TEXT,
  mpesa_paybill TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Branches
CREATE TABLE branches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID REFERENCES organisations(id),
  name            TEXT NOT NULL,
  etims_branch_code TEXT,
  address         TEXT,
  phone           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Users
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID REFERENCES organisations(id),
  branch_id     UUID REFERENCES branches(id),
  name          TEXT NOT NULL,
  email         TEXT UNIQUE,
  pin_hash      TEXT NOT NULL,       -- bcrypt hash of 4-digit PIN
  role          TEXT NOT NULL CHECK (role IN ('cashier','manager','admin')),
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Product Categories
CREATE TABLE categories (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id    UUID REFERENCES organisations(id),
  name      TEXT NOT NULL,           -- e.g. 'Books', 'Stationery', 'Art Supplies'
  parent_id UUID REFERENCES categories(id)
);

-- Products
CREATE TABLE products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID REFERENCES organisations(id),
  category_id     UUID REFERENCES categories(id),
  sku             TEXT NOT NULL,
  barcode         TEXT,              -- EAN-13 or ISBN-13
  name            TEXT NOT NULL,
  description     TEXT,
  author          TEXT,              -- for books
  publisher       TEXT,              -- for books
  unit            TEXT DEFAULT 'each',
  buying_price    NUMERIC(12,2) NOT NULL,
  selling_price   NUMERIC(12,2) NOT NULL,
  vat_rate        NUMERIC(5,2) DEFAULT 16.00,  -- 0, 0 (zero-rated), 16
  vat_type        TEXT DEFAULT 'standard' CHECK (vat_type IN ('standard','zero','exempt')),
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, sku)
);

-- Stock Levels (per branch)
CREATE TABLE stock_levels (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID REFERENCES products(id),
  branch_id       UUID REFERENCES branches(id),
  quantity        NUMERIC(12,3) DEFAULT 0,
  reorder_level   NUMERIC(12,3) DEFAULT 5,
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, branch_id)
);

-- Suppliers
CREATE TABLE suppliers (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id    UUID REFERENCES organisations(id),
  name      TEXT NOT NULL,
  phone     TEXT,
  email     TEXT,
  address   TEXT
);

-- Goods Received Notes
CREATE TABLE grns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id       UUID REFERENCES branches(id),
  supplier_id     UUID REFERENCES suppliers(id),
  received_by     UUID REFERENCES users(id),
  reference_no    TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE grn_lines (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grn_id      UUID REFERENCES grns(id),
  product_id  UUID REFERENCES products(id),
  quantity    NUMERIC(12,3) NOT NULL,
  unit_cost   NUMERIC(12,2) NOT NULL
);

-- Shifts / Till Sessions
CREATE TABLE shifts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id       UUID REFERENCES branches(id),
  cashier_id      UUID REFERENCES users(id),
  opened_at       TIMESTAMPTZ DEFAULT now(),
  closed_at       TIMESTAMPTZ,
  opening_float   NUMERIC(12,2) DEFAULT 0,
  closing_float   NUMERIC(12,2),
  status          TEXT DEFAULT 'open' CHECK (status IN ('open','closed'))
);

-- Transactions (Sales)
CREATE TABLE transactions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id            UUID REFERENCES shifts(id),
  branch_id           UUID REFERENCES branches(id),
  cashier_id          UUID REFERENCES users(id),
  transaction_no      TEXT NOT NULL UNIQUE,  -- e.g. TXN-20260430-00042
  status              TEXT DEFAULT 'completed' CHECK (status IN ('completed','voided','held')),
  subtotal            NUMERIC(12,2) NOT NULL,
  discount_amount     NUMERIC(12,2) DEFAULT 0,
  vat_amount          NUMERIC(12,2) NOT NULL,
  total               NUMERIC(12,2) NOT NULL,
  cash_tendered       NUMERIC(12,2) DEFAULT 0,
  change_given        NUMERIC(12,2) DEFAULT 0,
  mpesa_amount        NUMERIC(12,2) DEFAULT 0,
  mpesa_ref           TEXT,
  mpesa_phone         TEXT,
  customer_phone      TEXT,
  customer_email      TEXT,
  etims_invoice_no    TEXT,
  etims_qr_code       TEXT,
  etims_status        TEXT DEFAULT 'pending' CHECK (etims_status IN ('pending','submitted','failed')),
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- Transaction Line Items
CREATE TABLE transaction_lines (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id  UUID REFERENCES transactions(id),
  product_id      UUID REFERENCES products(id),
  product_name    TEXT NOT NULL,    -- denormalised snapshot at time of sale
  sku             TEXT NOT NULL,
  barcode         TEXT,
  quantity        NUMERIC(12,3) NOT NULL,
  unit_price      NUMERIC(12,2) NOT NULL,
  discount_pct    NUMERIC(5,2) DEFAULT 0,
  vat_rate        NUMERIC(5,2) NOT NULL,
  vat_type        TEXT NOT NULL,
  line_total      NUMERIC(12,2) NOT NULL
);

-- Audit Log
CREATE TABLE audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID REFERENCES organisations(id),
  user_id     UUID REFERENCES users(id),
  action      TEXT NOT NULL,
  entity_type TEXT,
  entity_id   UUID,
  old_data    JSONB,
  new_data    JSONB,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Offline Sync Queue
CREATE TABLE sync_queue (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id     TEXT NOT NULL,
  operation     TEXT NOT NULL,     -- 'INSERT' | 'UPDATE' | 'DELETE'
  table_name    TEXT NOT NULL,
  payload       JSONB NOT NULL,
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending','synced','failed')),
  created_at    TIMESTAMPTZ DEFAULT now(),
  synced_at     TIMESTAMPTZ
);
```

---

## 4. Offline-First Architecture

### 4.1 Strategy

The POS uses a **local-first** approach:

1. All writes go to local SQLite first
2. A background sync worker pushes changes to the server
3. The server resolves conflicts using **last-write-wins with vector clocks** for non-financial data, and **append-only immutable records** for transactions

### 4.2 Sync Flow

```
[Cashier Action]
     │
     ▼
[Local SQLite Write]
  + assign local UUID
  + mark sync_status = 'pending'
     │
     ▼
[UI Updates Immediately]  ← user sees response instantly
     │
     ▼ (background)
[Service Worker / Sync Worker]
  checks connectivity
     │
   online?
  ┌──┴──┐
 yes    no
  │      └─ retry with exponential backoff
  ▼
[POST /api/sync/batch]
  send up to 50 pending records
     │
     ▼
[Server resolves conflicts]
  returns ACK with server UUIDs
     │
     ▼
[Local SQLite: mark synced]
  update sync_status = 'synced'
```

### 4.3 Conflict Resolution Rules

| Data Type | Conflict Strategy |
|---|---|
| Transactions | Append-only; no updates allowed post-completion. Voids create a new void record. |
| Stock levels | Server-side count is authoritative; local adjustments are queued as deltas, not absolute values |
| Product prices | Server wins; local cache invalidated on reconnect |
| User sessions | Local PIN auth valid offline; online sync validates against server on next connect |

---

## 5. M-Pesa Integration Architecture

### 5.1 Flow Diagram

```
Customer Phone              POS Terminal              Duka API              Safaricom Daraja
      │                          │                       │                        │
      │                          │  1. POST /mpesa/stkpush                        │
      │                          │─────────────────────>│                        │
      │                          │                       │ 2. STK Push Request   │
      │                          │                       │──────────────────────>│
      │<──────────────────────────────────────────────────────────────────────────│
      │  3. "Enter M-Pesa PIN"   │                       │                        │
      │                          │  4. WS: status=pending│                        │
      │                          │<─────────────────────│                        │
      │  5. Customer enters PIN  │                       │                        │
      │──────────────────────────────────────────────────────────────────────────>│
      │                          │                       │  6. Callback (result)  │
      │                          │                       │<──────────────────────│
      │                          │                       │ 7. Push to Redis queue │
      │                          │                       │ 8. WS: status=confirmed│
      │                          │<─────────────────────│                        │
      │                          │ 9. Complete transaction│                       │
```

### 5.2 STK Push Implementation

```typescript
// services/mpesa.service.ts

interface STKPushRequest {
  phoneNumber: string;       // Format: 254XXXXXXXXX
  amount: number;            // Integer KES
  accountReference: string;  // Transaction number
  transactionDesc: string;
}

interface STKPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

// Daraja OAuth + STK Push
async function initiateStkPush(req: STKPushRequest): Promise<STKPushResponse> {
  const token = await getDarajaToken();
  const timestamp = format(new Date(), 'yyyyMMddHHmmss');
  const password = Buffer.from(
    `${BUSINESS_SHORT_CODE}${LIPA_NA_MPESA_PASSKEY}${timestamp}`
  ).toString('base64');

  return axios.post(`${DARAJA_BASE_URL}/mpesa/stkpush/v1/processrequest`, {
    BusinessShortCode: BUSINESS_SHORT_CODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerBuyGoodsOnline',
    Amount: Math.ceil(req.amount),
    PartyA: req.phoneNumber,
    PartyB: BUSINESS_SHORT_CODE,
    PhoneNumber: req.phoneNumber,
    CallBackURL: `${API_BASE_URL}/mpesa/callback`,
    AccountReference: req.accountReference,
    TransactionDesc: req.transactionDesc
  }, { headers: { Authorization: `Bearer ${token}` } });
}
```

### 5.3 Callback Handler & WebSocket Push

```typescript
// routes/mpesa.routes.ts

router.post('/mpesa/callback', async (req, res) => {
  const { Body: { stkCallback } } = req.body;
  const { CheckoutRequestID, ResultCode, CallbackMetadata } = stkCallback;

  // Always respond 200 immediately to Daraja
  res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });

  const status = ResultCode === 0 ? 'confirmed' : 'failed';
  const mpesaRef = CallbackMetadata?.Item?.find(i => i.Name === 'MpesaReceiptNumber')?.Value;

  // Publish to Redis channel for WebSocket relay
  await redis.publish(`mpesa:${CheckoutRequestID}`, JSON.stringify({ status, mpesaRef }));

  // Update transaction record
  await db.transaction.update({
    where: { mpesaCheckoutId: CheckoutRequestID },
    data: { mpesaStatus: status, mpesaRef }
  });
});
```

---

## 6. KRA eTIMS Integration Architecture

### 6.1 eTIMS Service Layer

The eTIMS integration is wrapped in a service that handles queuing, retries, and compliance formatting.

```typescript
// services/etims.service.ts

interface EtimsInvoice {
  invoiceNo: string;
  invoiceDate: string;         // ISO 8601
  traderSystemInvoiceNo: string;
  cashierId: string;
  customerPin?: string;        // optional: for B2B sales
  currency: 'KES';
  items: EtimsLineItem[];
  taxBreakdown: TaxBreakdown[];
  totalAmount: number;
  vatAmount: number;
}

async function submitInvoice(invoice: EtimsInvoice): Promise<void> {
  // Queue for async submission
  await etimsQueue.add('submit-invoice', invoice, {
    attempts: 5,
    backoff: { type: 'exponential', delay: 2000 }
  });
}

// BullMQ processor
etimsQueue.process('submit-invoice', async (job) => {
  const { data: invoice } = job;
  const response = await axios.post(`${ETIMS_API_URL}/invoices`, invoice, {
    headers: {
      'Authorization': `Bearer ${ETIMS_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  await db.transaction.update({
    where: { transactionNo: invoice.traderSystemInvoiceNo },
    data: {
      etimsInvoiceNo: response.data.invoiceNo,
      etimsQrCode: response.data.qrCode,
      etimsStatus: 'submitted'
    }
  });
});
```

### 6.2 VAT Calculation Rules

```typescript
function calculateVAT(items: CartItem[]): VATBreakdown {
  const breakdown = { standard: 0, zero: 0, exempt: 0, vatAmount: 0 };

  for (const item of items) {
    const lineTotal = item.quantity * item.unitPrice * (1 - item.discountPct / 100);

    switch (item.vatType) {
      case 'standard':
        const vatExclusive = lineTotal / 1.16;
        breakdown.standard += vatExclusive;
        breakdown.vatAmount += lineTotal - vatExclusive;
        break;
      case 'zero':
        breakdown.zero += lineTotal;  // taxable but 0% rate
        break;
      case 'exempt':
        breakdown.exempt += lineTotal; // not subject to VAT
        break;
    }
  }
  return breakdown;
}
```

---

## 7. Security Architecture

### 7.1 Authentication

- PIN-based auth for cashiers (4–6 digit PIN, bcrypt hashed, salted)
- Password-based auth for managers/admin on the web portal
- JWT access token (15 min expiry) + refresh token (7 days, rotated on use)
- Offline PIN validation: compare locally-cached bcrypt hash when offline

### 7.2 Authorisation (RBAC)

```typescript
const PERMISSIONS = {
  cashier: [
    'transaction:create',
    'transaction:hold',
    'receipt:print',
    'shift:view-own'
  ],
  manager: [
    ...PERMISSIONS.cashier,
    'transaction:void',
    'discount:apply-large',
    'report:view',
    'shift:close',
    'stock:adjust'
  ],
  admin: [
    ...PERMISSIONS.manager,
    'user:manage',
    'product:manage',
    'price:update',
    'report:export',
    'settings:update'
  ]
};
```

### 7.3 Data Security

- All traffic over HTTPS/TLS 1.3
- Database connections over TLS
- Sensitive fields (PIN hashes, M-Pesa credentials) never returned in API responses
- PCI-adjacent: no card data stored; M-Pesa credentials stored as environment variables, never in DB
- Audit log is append-only (no UPDATE/DELETE on `audit_log` table; enforced via DB trigger)

### 7.4 Network Security

- API rate limiting: 100 req/min per IP (Redis-backed)
- M-Pesa callback endpoint: IP whitelist to Safaricom IP ranges
- eTIMS endpoint: mutual TLS if required by KRA

---

## 8. Infrastructure & Deployment

### 8.1 Docker Compose (Production)

```yaml
version: '3.9'
services:
  api:
    build: ./apps/api
    env_file: .env
    ports: ['3000:3000']
    depends_on: [db, redis]
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: dukapos
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redisdata:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports: ['80:80', '443:443']
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./dist:/usr/share/nginx/html   # PWA static files
    depends_on: [api]
    restart: unless-stopped

volumes:
  pgdata:
  redisdata:
```

### 8.2 Environment Variables

```bash
# API
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@db:5432/dukapos
REDIS_URL=redis://redis:6379
JWT_SECRET=<64-char random>
JWT_REFRESH_SECRET=<64-char random>

# M-Pesa (Daraja)
DARAJA_CONSUMER_KEY=<from Safaricom portal>
DARAJA_CONSUMER_SECRET=<from Safaricom portal>
DARAJA_PASSKEY=<Lipa na M-Pesa passkey>
DARAJA_BUSINESS_SHORT_CODE=<till or paybill number>
DARAJA_ENV=production   # or sandbox

# KRA eTIMS
ETIMS_API_URL=https://etims.kra.go.ke/api/v1
ETIMS_API_KEY=<from KRA developer portal>
ETIMS_TRADER_PIN=<KRA PIN>
ETIMS_BRANCH_CODE=<branch code>

# SMS
AT_API_KEY=<Africa's Talking API key>
AT_SENDER=DUKAPOS

# Backups
S3_BUCKET=dukapos-backups
S3_ENDPOINT=https://r2.cloudflarestorage.com
S3_ACCESS_KEY=<Cloudflare R2 key>
S3_SECRET_KEY=<Cloudflare R2 secret>
```

---

## 9. Design System

### 9.1 Principles

- **Clarity first:** Every element must be readable from 60cm on a tablet. No small text on the POS screen.
- **Touch-optimised:** Minimum tap target 48×48px. Primary action buttons ≥ 64px tall.
- **Reduced cognitive load:** POS screen has one primary action at a time. No nested menus during a sale.
- **High contrast:** Designed to work under shop fluorescent lighting and direct sunlight on cheap screens.
- **Error recovery:** Every destructive action requires confirmation. Errors shown in plain Swahili/English.

### 9.2 Colour Palette

```css
/* Brand */
--color-primary:        #1E6B45;  /* Forest green — Kenyan brand, trust */
--color-primary-dark:   #154D32;
--color-primary-light:  #E8F5EE;

/* Semantic */
--color-success:        #16A34A;
--color-warning:        #D97706;
--color-error:          #DC2626;
--color-info:           #2563EB;

/* Neutrals */
--color-neutral-900:    #111827;  /* Primary text */
--color-neutral-700:    #374151;  /* Secondary text */
--color-neutral-400:    #9CA3AF;  /* Muted text */
--color-neutral-100:    #F3F4F6;  /* Backgrounds */
--color-neutral-50:     #F9FAFB;
--color-white:          #FFFFFF;

/* Till-specific */
--color-till-bg:        #F0F4F8;  /* POS screen background */
--color-cart-bg:        #FFFFFF;
--color-numpad-key:     #E2E8F0;
--color-numpad-action:  #1E6B45;
```

### 9.3 Typography

```css
/* Stack: system fonts for performance, no web font dependency */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Courier New', monospace; /* for amounts, codes */

/* Scale */
--text-xs:   0.75rem;   /* 12px — tags, labels */
--text-sm:   0.875rem;  /* 14px — secondary text */
--text-base: 1rem;      /* 16px — body */
--text-lg:   1.125rem;  /* 18px — POS item names */
--text-xl:   1.25rem;   /* 20px — section headers */
--text-2xl:  1.5rem;    /* 24px — totals, amounts */
--text-4xl:  2.25rem;   /* 36px — cart total (must be unmissable) */
```

### 9.4 Spacing

8px base grid. All spacing in multiples of 4px (0.25rem increments).

### 9.5 POS Screen Layout

```
┌──────────────────────────────────────────────────────────┐
│ HEADER: Shop name │ Shift: John │ 14:32 │ ● Online  [≡] │
├────────────────────────────────┬─────────────────────────┤
│  SEARCH / SCAN BAR             │                         │
│  [🔍 Search product or scan]   │   CART                  │
├────────────────────────────────┤                         │
│  QUICK CATEGORIES              │  Item 1 ........  120   │
│  [Books] [Stationery] [Art]    │  Item 2 ........   45   │
├────────────────────────────────┤  Item 3 ........  200   │
│  PRODUCT GRID                  │                         │
│  ┌──────┐ ┌──────┐ ┌──────┐  │  ─────────────────────  │
│  │ Prod │ │ Prod │ │ Prod │  │  Subtotal:      KES 365 │
│  │  A   │ │  B   │ │  C   │  │  VAT (16%):      KES 51 │
│  └──────┘ └──────┘ └──────┘  │  TOTAL:         KES 416 │
│                                │                         │
│                                ├─────────────────────────┤
│                                │ [CASH]  [M-PESA] [SPLIT]│
└────────────────────────────────┴─────────────────────────┘
```

---

## 10. Component Architecture

### 10.1 Key Components

```
src/
├── components/
│   ├── pos/
│   │   ├── POSScreen.tsx          # Main POS layout
│   │   ├── ProductSearch.tsx      # Barcode + text search
│   │   ├── ProductGrid.tsx        # Category-filtered product grid
│   │   ├── Cart.tsx               # Cart items + totals
│   │   ├── CartItem.tsx           # Single line item with qty controls
│   │   ├── PaymentModal.tsx       # Payment method selection
│   │   ├── CashPayment.tsx        # Cash + change calc
│   │   ├── MpesaPayment.tsx       # STK push + status polling
│   │   ├── SplitPayment.tsx       # Mixed cash + M-Pesa
│   │   └── ReceiptModal.tsx       # Print / SMS / email receipt
│   ├── inventory/
│   │   ├── ProductList.tsx
│   │   ├── ProductForm.tsx
│   │   ├── StockLevels.tsx
│   │   └── GRNForm.tsx
│   ├── reports/
│   │   ├── Dashboard.tsx
│   │   ├── ZReport.tsx
│   │   ├── SalesChart.tsx
│   │   └── TopProducts.tsx
│   └── shared/
│       ├── Numpad.tsx             # Touch numpad for qty / amounts
│       ├── PINEntry.tsx           # 4-digit PIN input
│       ├── StatusBadge.tsx
│       └── ConnectivityIndicator.tsx
├── stores/
│   ├── cart.store.ts              # Zustand: active cart state
│   ├── shift.store.ts             # Active shift / cashier
│   └── sync.store.ts              # Offline queue state
├── services/
│   ├── mpesa.service.ts
│   ├── etims.service.ts
│   ├── printer.service.ts
│   └── sync.service.ts
└── db/
    ├── local.db.ts                # SQLite wasm setup
    └── migrations/                # Local schema migrations
```

---

## 11. Performance Requirements

| Scenario | Target |
|---|---|
| POS screen initial load (cached) | < 500ms |
| Product search results | < 200ms |
| Add item to cart | < 50ms |
| M-Pesa STK push initiation | < 1 second (API call) |
| Receipt print command sent | < 500ms |
| Z-report generation | < 3 seconds (up to 1000 transactions) |
| Offline→online sync (100 records) | < 10 seconds |
| Database query (indexed lookups) | < 50ms |

---

## 12. Testing Strategy

### 12.1 Unit Tests (Jest + Vitest)

- VAT calculation functions
- Change calculation
- Offline conflict resolution logic
- M-Pesa callback parsing
- eTIMS invoice formatting

### 12.2 Integration Tests (Supertest)

- Full transaction flow (create → pay → receipt)
- M-Pesa STK push mock (Daraja sandbox)
- eTIMS submission queue
- Sync endpoint with conflict scenarios

### 12.3 E2E Tests (Playwright)

- Happy path: scan item → M-Pesa payment → receipt
- Happy path: scan item → cash payment → change display
- Offline mode: complete sale offline → verify sync on reconnect
- Role-based access: cashier cannot access manager screen

### 12.4 Manual QA Checklist (Pre-release)

- [ ] Receipt prints correctly on Epson TM-T20 and generic ESC/POS
- [ ] M-Pesa STK push and callback on Safaricom live environment
- [ ] eTIMS submission on KRA test environment
- [ ] Barcode scan accuracy with worn/damaged barcodes
- [ ] Touch target accuracy on 7" tablet at 60% brightness
- [ ] Offline operation for full trading day simulation

# Technical Specification
## Duka la Vitabu — Kenya Bookshop & Stationery POS System

> **Version:** 1.0  
> **Status:** Draft  
> **Owner:** Engineering Team  
> **Last Updated:** May 2026  
> **Classification:** Internal — Engineering

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Frontend Architecture](#2-frontend-architecture)
3. [Backend Architecture](#3-backend-architecture)
4. [Database Design](#4-database-design)
5. [Offline Sync Architecture](#5-offline-sync-architecture)
6. [M-Pesa Integration](#6-m-pesa-integration)
7. [KRA eTIMS Integration](#7-kra-etims-integration)
8. [Authentication & Security](#8-authentication--security)
9. [Receipt & Printing System](#9-receipt--printing-system)
10. [SMS & Notifications](#10-sms--notifications)
11. [API Reference](#11-api-reference)
12. [Infrastructure & DevOps](#12-infrastructure--devops)
13. [Performance Targets](#13-performance-targets)
14. [Error Handling Strategy](#14-error-handling-strategy)
15. [Testing Strategy](#15-testing-strategy)

---

## 1. Architecture Overview

### 1.1 System Architecture

The system follows a **cloud-first, offline-capable, multi-tenant SaaS** pattern. The POS terminal runs as a PWA with a local database as the primary operational store. The cloud database is the sync target and source of truth for reporting.

```
┌──────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                 │
│                                                                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │
│  │   POS Terminal  │  │  Owner Dashboard │  │  Stock Manager Tab  │  │
│  │  (PWA / React)  │  │  (PWA / React)   │  │   (PWA / Android)   │  │
│  │  IndexedDB      │  │  Read-only view  │  │   GRN + stocktake   │  │
│  │  Service Worker │  │                  │  │                     │  │
│  └────────┬────────┘  └────────┬─────────┘  └──────────┬──────────┘  │
└───────────┼────────────────────┼───────────────────────┼─────────────┘
            │ HTTPS REST API     │                        │
┌───────────┼────────────────────┼───────────────────────┼─────────────┐
│                         API LAYER (Node.js / Express)                 │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  /auth  /sales  /inventory  /customers  /payments  /reports  │    │
│  │  /suppliers  /users  /sync  /etims  /mpesa  /print           │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐             │
│  │  Daraja API  │  │  KRA eTIMS   │  │ Africa's Talking│             │
│  │  (M-Pesa)    │  │  API         │  │ SMS Gateway     │             │
│  └──────────────┘  └──────────────┘  └────────────────┘             │
│  ┌──────────────┐  ┌──────────────┐                                  │
│  │   BullMQ     │  │  node-cron   │                                  │
│  │  Job Queue   │  │  Scheduler   │                                  │
│  └──────────────┘  └──────────────┘                                  │
└───────────────────────────────────────────────────────────────────────┘
            │
┌───────────┼───────────────────────────────────────────────────────────┐
│                         DATA LAYER                                    │
│  ┌──────────────────────┐  ┌──────────────────────────────────────┐  │
│  │  PostgreSQL 18       │  │  Redis 7 (Upstash or self-hosted)    │  │
│  │  Multi-tenant schema │  │  Sessions + BullMQ + rate limiting   │  │
│  │  ACID transactions   │  │                                      │  │
│  └──────────────────────┘  └──────────────────────────────────────┘  │
│  ┌──────────────────────┐  ┌──────────────────────────────────────┐  │
│  │  Backblaze B2 / S3   │  │  SQLite (Client / Dexie.js)       │  │
│  │  Backups + uploads   │  │  Local operational database          │  │
│  └──────────────────────┘  └──────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────┘
```

### 1.2 Multi-Tenancy Model

- **Pattern:** Shared database, separate PostgreSQL schemas per tenant
- Schema naming: `tenant_{shop_id}` (e.g., `tenant_001`)
- Shared schema `public` holds: tenants, plans, billing, platform-level audit logs
- Row-level security (RLS) via PostgreSQL policies as a secondary guard
- Tenant ID extracted from JWT on every request; injected into DB query context

### 1.3 Deployment Model

- **Cloud host:** Hetzner Cloud (Frankfurt + Johannesburg nodes) or Railway.app
- **Containerised:** Docker Compose for local dev; Kubernetes or Railway for production
- **CDN:** Cloudflare for static assets + DDoS protection
- **Domain:** `*.dukalavitabu.co.ke` — `app.` for POS, `api.` for backend, `admin.` for platform admin

---

## 2. Frontend Architecture

### 2.1 Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| Framework | React 18 + TypeScript | Component model, large ecosystem, TypeScript for safety |
| Build tool | Vite | Fast HMR, excellent PWA plugin support |
| PWA | vite-plugin-pwa + Workbox | Service Worker generation, offline caching strategies |
| State management | Zustand | Lightweight, no boilerplate, works well with offline patterns |
| Local DB | Dexie.js (IndexedDB wrapper) | Typed, promise-based IndexedDB; handles large offline datasets |
| HTTP client | Axios + React Query | Caching, background refresh, optimistic updates |
| UI components | Custom design system (Tailwind CSS) | No generic library; distinctive POS-specific UX |
| Routing | React Router v6 | Standard SPA routing |
| Forms | React Hook Form + Zod | Performance, validation, TypeScript integration |
| Printing | ESC/POS encoder (escpos-xml or receipt-printer-encoder) | Thermal printer command generation |
| Charting | Recharts | Lightweight, composable charts for dashboards |
| i18n | react-i18next | English / Swahili language switching |

### 2.2 PWA Configuration

```typescript
// vite.config.ts (PWA relevant section)
VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    runtimeCaching: [
      {
        // Product catalogue: cache-first (updated on sync)
        urlPattern: /\/api\/v1\/products/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'products-cache',
          expiration: { maxEntries: 10000, maxAgeSeconds: 86400 }
        }
      },
      {
        // API calls: network-first, fall back to cache
        urlPattern: /\/api\/v1\/.*/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          networkTimeoutSeconds: 5
        }
      }
    ]
  },
  manifest: {
    name: 'Duka la Vitabu POS',
    short_name: 'DLV POS',
    theme_color: '#1B4332',
    icons: [/* ... */]
  }
})
```

### 2.3 Application Modules

```
src/
├── modules/
│   ├── pos/              # Checkout interface
│   │   ├── Cart.tsx
│   │   ├── ProductSearch.tsx
│   │   ├── PaymentModal.tsx
│   │   └── ReceiptPreview.tsx
│   ├── inventory/        # Stock management
│   ├── customers/        # CRM and credit accounts
│   ├── suppliers/        # Supplier and PO management
│   ├── reports/          # Analytics dashboards
│   ├── settings/         # Shop config, users, hardware
│   └── sync/             # Offline sync status and management
├── store/
│   ├── cartStore.ts      # Zustand: active cart state
│   ├── authStore.ts      # Zustand: user session
│   └── syncStore.ts      # Zustand: online/offline status, pending count
├── db/
│   ├── schema.ts         # Dexie schema definition
│   ├── sales.ts          # Local sale CRUD operations
│   ├── products.ts       # Local product cache operations
│   └── sync.ts           # Sync queue management
├── hooks/
│   ├── useBarcodeScanner.ts
│   ├── usePrinter.ts
│   ├── useMpesa.ts
│   └── useOnlineStatus.ts
└── lib/
    ├── mpesa.ts          # STK Push client
    ├── etims.ts          # eTIMS client
    └── printer.ts        # ESC/POS printer abstraction
```

### 2.4 Offline State Machine

```typescript
// Connectivity states
type ConnectivityState = 
  | 'online'           // Full functionality
  | 'offline-cash'     // Cash sales only; M-Pesa disabled
  | 'syncing'          // Back online, flushing queue
  | 'conflict'         // Manual resolution required (>72h offline)

// Zustand store
interface SyncStore {
  status: ConnectivityState
  pendingCount: number
  lastSyncAt: Date | null
  offlineSince: Date | null
  setStatus: (s: ConnectivityState) => void
  enqueueSale: (sale: LocalSale) => Promise<void>
  flushQueue: () => Promise<SyncResult>
}
```

### 2.5 Barcode Scanner Integration

USB HID barcode scanners present as keyboard emulators. The integration works via a global input listener:

```typescript
// hooks/useBarcodeScanner.ts
export function useBarcodeScanner(onScan: (barcode: string) => void) {
  const buffer = useRef('')
  const timer = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Scanner inputs are rapid; detect by inter-key timing < 50ms
      if (e.key === 'Enter' && buffer.current.length > 3) {
        onScan(buffer.current)
        buffer.current = ''
        return
      }
      buffer.current += e.key
      clearTimeout(timer.current)
      timer.current = setTimeout(() => { buffer.current = '' }, 100)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onScan])
}
```

---

## 3. Backend Architecture
Uses a modular monolith structure so thta its easier to scale to a microservice architecture in the future future

### 3.1 Technology Stack

| Component | Technology | Version |
|---|---|---|
| Runtime | Node.js | 22 LTS |
| Framework | Express.js | 5.x |
| Language | TypeScript | 5.x |
| ORM | Prisma | 5.x |
| Auth(Better Auth) | JWT + Refresh tokens | jsonwebtoken 9.x |
| Task queue | BullMQ | 5.x |
| Scheduler | node-cron | 3.x |
| Validation | Zod | 3.x |
| Logging | Pino + pino-http | 9.x |
| Testing | Vitest + Supertest | Latest |

### 3.2 Folder Structure

```
├── nodemon.json
├── package.json
├── pnpm-lock.yaml
├── prisma.config.ts
├── src
│   ├── api
│   │   ├── app.ts
│   │   └── index.ts
│   ├── config
│   │   ├── env.ts
│   │   └── redis.ts
│   ├── infra
│   │   ├── db
│   │   │   └── index.ts
│   │   └── redis
│   │       ├── auth.ts
│   │       ├── bullmq.ts
│   │       ├── cache.ts
│   │       └── index.ts
│   ├── logger
│   │   ├── index.ts
│   │   ├── pino.ts
│   │   └── winston.ts
│   ├── middleware
│   │   ├── error.middleware.ts
│   │   ├── log.middleware.ts
│   │   ├── notFound.middleware.ts
│   │   ├── requestId.middleware.ts
│   │   └── requestLogger.middleware.ts
│   ├── modules
│   │   ├── auth
│   │   │   ├── auth.config.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── controllers
│   │   │   ├── dto
│   │   │   ├── jobs
│   │   │   ├── repository
│   │   │   ├── routes
│   │   │   ├── services
│   │   │   └── validators
│   │   ├── customers
│   │   │   ├── controllers
│   │   │   ├── customers.module.ts
│   │   │   ├── dto
│   │   │   ├── jobs
│   │   │   ├── repository
│   │   │   ├── routes
│   │   │   ├── services
│   │   │   └── validators
│   │   ├── etims
│   │   │   ├── controllers
│   │   │   ├── dto
│   │   │   ├── etims.module.ts
│   │   │   ├── jobs
│   │   │   ├── repository
│   │   │   ├── routes
│   │   │   ├── services
│   │   │   └── validators
│   │   ├── inventory
│   │   │   ├── controllers
│   │   │   ├── dto
│   │   │   ├── inventory.module.ts
│   │   │   ├── jobs
│   │   │   ├── repository
│   │   │   ├── routes
│   │   │   ├── services
│   │   │   └── validators
│   │   ├── payments
│   │   │   ├── controllers
│   │   │   ├── dto
│   │   │   ├── jobs
│   │   │   ├── payments.module.ts
│   │   │   ├── repository
│   │   │   ├── routes
│   │   │   ├── services
│   │   │   └── validators
│   │   ├── reports
│   │   │   ├── controllers
│   │   │   ├── dto
│   │   │   ├── jobs
│   │   │   ├── reports.module.ts
│   │   │   ├── repository
│   │   │   ├── routes
│   │   │   ├── services
│   │   │   └── validators
│   │   ├── sales
│   │   │   ├── controllers
│   │   │   ├── dto
│   │   │   ├── jobs
│   │   │   ├── repository
│   │   │   ├── routes
│   │   │   ├── sales.module.ts
│   │   │   ├── services
│   │   │   └── validators
│   │   ├── suppliers
│   │   ├── sync
│   │   └── users
│   ├── queues
│   │   └── index.ts
│   ├── shared
│   │   ├── utils
│   │   │   ├── ApiError.ts
│   │   │   ├── ApiResponse.ts
│   │   │   ├── asynchandler.ts
│   │   │   └── index.ts
│   │   └── validator
│   │       └── validators.ts
│   ├── types
│   │   ├── express
│   │   │   └── index.d.ts
│   │   └── http
│   │       └── index.d.ts
│   └── workers
└── tsconfig.json

```

### 3.3 Tenant Middleware

```typescript
// middleware/tenant.ts
export const tenantMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const tenantId = req.auth?.tenantId
  if (!tenantId) return res.status(401).json({ error: 'Tenant not identified' })
  
  // Set search_path for this request's DB connection
  await prisma.$executeRaw`SET search_path TO ${Prisma.raw(`tenant_${tenantId}`)}, public`
  req.tenantId = tenantId
  next()
}
```

### 3.4 RBAC Middleware

```typescript
// middleware/rbac.ts
type Permission = 
  | 'sales:create' | 'sales:void' | 'sales:read'
  | 'inventory:read' | 'inventory:write' | 'inventory:adjust'
  | 'customers:read' | 'customers:write'
  | 'reports:basic' | 'reports:financial' | 'reports:full'
  | 'settings:write' | 'users:manage'
  | 'prices:write' | 'discounts:approve'

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  OWNER:          ['*'], // all
  BRANCH_MANAGER: ['sales:*', 'inventory:*', 'customers:*', 'reports:*', 'discounts:approve'],
  CASHIER:        ['sales:create', 'sales:read', 'inventory:read', 'customers:read'],
  STOCK_CLERK:    ['inventory:read', 'inventory:write', 'inventory:adjust'],
  ACCOUNTANT:     ['reports:*', 'customers:read', 'sales:read']
}

export const requirePermission = (perm: Permission) => 
  (req: Request, res: Response, next: NextFunction) => {
    const userPerms = ROLE_PERMISSIONS[req.auth.role]
    if (userPerms.includes('*') || userPerms.includes(perm)) return next()
    return res.status(403).json({ error: 'Insufficient permissions' })
  }
```
---

## 4. Database Design

### 4.1 Core Schema (PostgreSQL — per-tenant schema)

```sql
-- Products
CREATE TABLE products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku             VARCHAR(50) UNIQUE NOT NULL,
  barcode         VARCHAR(50),
  name            VARCHAR(255) NOT NULL,
  name_sw         VARCHAR(255),               -- Swahili name
  category_id     UUID REFERENCES categories(id),
  unit            VARCHAR(20) DEFAULT 'piece', -- piece, packet, ream, box
  cost_price      NUMERIC(12,2) NOT NULL DEFAULT 0,
  selling_price   NUMERIC(12,2) NOT NULL,
  vat_type        VARCHAR(10) NOT NULL DEFAULT 'exempt', -- exempt | standard (16%)
  reorder_point   INTEGER DEFAULT 5,
  is_service      BOOLEAN DEFAULT false,       -- e.g. photocopying
  publisher       VARCHAR(100),
  isbn            VARCHAR(20),
  curriculum      VARCHAR(20),                 -- CBC | 844 | both
  subject         VARCHAR(50),
  school_level    VARCHAR(50),                 -- Grade 1–9, Form 1–4, etc.
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory (per branch)
CREATE TABLE inventory (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES products(id),
  branch_id       UUID NOT NULL REFERENCES branch.es(id),
  quantity        INTEGER NOT NULL DEFAULT 0,
  reserved        INTEGER NOT NULL DEFAULT 0,  -- reserved for pending orders
  UNIQUE (product_id, branch_id)
);ar

-- Sales
CREATE TABLE sales (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  local_id        UUID NOT NULL UNIQUE,        -- client-generated UUID for offline dedup
  branch_id       UUID NOT NULL REFERENCES branches(id),
  cashier_id      UUID NOT NULL REFERENCES users(id),
  customer_id     UUID REFERENCES customers(id),
  sale_type       VARCHAR(20) DEFAULT 'retail', -- retail | credit | quotation
  status          VARCHAR(20) DEFAULT 'completed', -- completed | voided | held
  subtotal        NUMERIC(12,2) NOT NULL,
  discount_amount NUMERIC(12,2) DEFAULT 0,
  vat_amount      NUMERIC(12,2) DEFAULT 0,
  total           NUMERIC(12,2) NOT NULL,
  notes           TEXT,
  voided_at       TIMESTAMPTZ,
  voided_by       UUID REFERENCES users(id),
  void_reason     TEXT,
  created_at      TIMESTAMPTZ NOT NULL,        -- transaction time (may differ from insert time if offline)
  synced_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE users (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  full_name           VARCHAR(100) NOT NULL,
  email               VARCHAR(150),                           -- optional; phone is primary identifier
  phone               VARCHAR(20)  NOT NULL,                  -- 07XX XXX XXX — used for login + OTP
  phone_verified      BOOLEAN      NOT NULL DEFAULT false,
  email_verified      BOOLEAN      NOT NULL DEFAULT false,

  -- Credentials
  password_hash       VARCHAR(255),                           -- NULL if PIN-only (cashier)
  pin_hash            VARCHAR(255),                           -- 4-digit PIN hash (bcrypt); quick re-auth at counter
  must_change_password BOOLEAN     NOT NULL DEFAULT false,    -- force reset on first login

  -- Role & Access
  role                VARCHAR(20)  NOT NULL DEFAULT 'cashier',
  -- Allowed values:
  --   'owner'          – full access; created on tenant signup
  --   'branch_manager' – full access to assigned branch
  --   'cashier'        – POS checkout only
  --   'stock_clerk'    – receive stock, run stock counts
  --   'accountant'     – reports and expenses, read-only sales

  -- Branch assignment (NULL = access to all branches — owner / accountant)
  branch_id           UUID         REFERENCES branches(id) ON DELETE SET NULL,

  -- Profile
  avatar_url          TEXT,
  language            VARCHAR(10)  NOT NULL DEFAULT 'en',     -- 'en' | 'sw'

  -- Security
  failed_login_count  INTEGER      NOT NULL DEFAULT 0,
  locked_until        TIMESTAMPTZ,                            -- set when failed_login_count >= 5
  last_login_at       TIMESTAMPTZ,
  last_login_ip       INET,
  last_login_device   TEXT,                                   -- user-agent string

  -- Two-Factor Auth (optional)
  otp_secret          VARCHAR(64),                            -- TOTP secret (base32)
  otp_enabled         BOOLEAN      NOT NULL DEFAULT false,

  -- Soft delete
  is_active           BOOLEAN      NOT NULL DEFAULT true,
  deactivated_at      TIMESTAMPTZ,
  deactivated_by      UUID         REFERENCES users(id),

  -- Timestamps
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_by          UUID         REFERENCES users(id)
);

-- Indexes
CREATE UNIQUE INDEX idx_users_phone_unique ON users(phone) WHERE is_active = true;
CREATE INDEX idx_users_role               ON users(role);
CREATE INDEX idx_users_branch             ON users(branch_id) WHERE branch_id IS NOT NULL;
CREATE INDEX idx_users_active             ON users(is_active) WHERE is_active = true;

-- Sale Items
CREATE TABLE sale_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id         UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES products(id),
  quantity        INTEGER NOT NULL,
  unit_price      NUMERIC(12,2) NOT NULL,
  discount        NUMERIC(12,2) DEFAULT 0,
  vat_amount      NUMERIC(12,2) DEFAULT 0,
  line_total      NUMERIC(12,2) NOT NULL
);

-- Payments
CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id         UUID NOT NULL REFERENCES sales(id),
  method          VARCHAR(20) NOT NULL,        -- cash | mpesa | bank | credit
  amount          NUMERIC(12,2) NOT NULL,
  reference       VARCHAR(100),               -- M-Pesa code, bank ref, etc.
  mpesa_receipt   VARCHAR(20),
  confirmed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);]

-- eTIMS Records
CREATE TABLE etims_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id         UUID NOT NULL REFERENCES sales(id),
  status          VARCHAR(20) DEFAULT 'pending', -- pending | submitted | confirmed | failed
  cu_serial       VARCHAR(50),                  -- KRA device serial
  invoice_number  VARCHAR(50),                  -- KRA invoice number
  validation_code VARCHAR(100),
  qr_data         TEXT,
  submitted_at    TIMESTAMPTZ,
  confirmed_at    TIMESTAMPTZ,
  retry_count     INTEGER DEFAULT 0,
  last_error      TEXT,
  raw_response    JSONB
);

-- Customers
CREATE TABLE customers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            VARCHAR(20) UNIQUE,
  name            VARCHAR(255) NOT NULL,
  phone           VARCHAR(20),
  email           VARCHAR(100),
  customer_type   VARCHAR(20) DEFAULT 'retail', -- retail | school | corporate
  credit_limit    NUMERIC(12,2) DEFAULT 0,
  credit_balance  NUMERIC(12,2) DEFAULT 0,      -- positive = they owe us
  loyalty_points  INTEGER DEFAULT 0,
  loyalty_tier    VARCHAR(10) DEFAULT 'bronze',  -- bronze | silver | gold
  kra_pin         VARCHAR(20),                   -- for VAT invoices
  address         TEXT,
  notes           TEXT,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- LPOs (Local Purchase Orders from schools)
CREATE TABLE lpos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES customers(id),
  lpo_number      VARCHAR(50) NOT NULL,
  lpo_date        DATE NOT NULL,
  amount          NUMERIC(12,2),
  status          VARCHAR(20) DEFAULT 'open',   -- open | fulfilled | cancelled
  document_url    TEXT,                          -- uploaded LPO scan
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Log
CREATE TABLE audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID,
  action          VARCHAR(100) NOT NULL,
  entity          VARCHAR(50),
  entity_id       UUID,
  old_value       JSONB,
  new_value       JSONB,
  ip_addressg      INET,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sales_branch_created ON sales(branch_id, created_at DESC);
CREATE INDEX idx_sales_customer ON sales(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX idx_etims_status ON etims_records(status) WHERE status IN ('pending','failed');
CREATE INDEX idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_products_isbn ON products(isbn) WHERE isbn IS NOT NULL;
CREATE INDEX idx_inventory_low_stock ON inventory(product_id) WHERE quantity <= 0;
```

### 4.2 Dexie.js (IndexedDB) Schema — Client

```typescript
// db/schema.ts
class DukaDB extends Dexie {
  products!: Table<LocalProduct>
  sales!: Table<LocalSale>
  saleItems!: Table<LocalSaleItem>
  payments!: Table<LocalPayment>
  customers!: Table<LocalCustomer>
  syncQueue!: Table<SyncQueueItem>
  settings!: Table<Setting>

  constructor() {
    super('DukaLaVitabu')
    this.version(1).stores({
      products:   'sku, barcode, isbn, name, categoryId, isActive',
      sales:      'localId, status, createdAt, syncStatus, cashierId',
      saleItems:  'id, saleLocalId, productSku',
      payments:   'id, saleLocalId, method',
      customers:  'id, phone, code, customerType',
      syncQueue:  '++id, type, entityId, status, createdAt',
      settings:   'key'
    })
  }
}
```

---

## 5. Offline Sync Architecture

### 5.1 Sync Flow

```
CLIENT                              SERVER
  │                                   │
  │  [OFFLINE] Cashier processes sale  │
  │  → Sale saved to IndexedDB         │
  │  → syncStatus = 'pending'          │
  │  → Receipt printed (no eTIMS code) │
  │                                   │
  │  [ONLINE DETECTED]                │
  │  ──────────────────────────────>  │
  │  POST /api/v1/sync/flush           │
  │  { sales: [...], payments: [...] } │
  │                                   │
  │  <──────────────────────────────  │
  │  { processed: 12, conflicts: 0,   │
  │    etimsResults: [...] }          │
  │                                   │
  │  → Update local records with      │
  │    server IDs + eTIMS codes       │
  │  → syncStatus = 'synced'          │
  │  → Optionally print supplement    │
  │    receipt with eTIMS QR          │
```

### 5.2 Conflict Resolution Rules

| Entity | Rule |
|---|---|
| Sales | Append-only; each sale has client UUID; no conflicts possible |
| Stock levels | Server-authoritative; client refreshes on sync |
| Prices | Server-authoritative; pushed to client on reconnect |
| Customers | Last-write-wins; server timestamp is tiebreaker |
| eTIMS codes | Server-generated; client stores returned value |

### 5.3 Sync Service

```typescript
// services/SyncService.ts
interface FlushPayload {
  deviceId: string
  tenantId: string
  sales: LocalSale[]
  saleItems: LocalSaleItem[]
  payments: LocalPayment[]
  grnEntries: LocalGRN[]
}

interface FlushResult {
  processed: number
  failed: number
  conflicts: ConflictRecord[]
  etimsResults: EtimsResult[]
  priceUpdates: ProductPrice[]
  stockSnapshot: Record<string, number>  // sku -> quantity
}

class SyncService {
  async flush(payload: FlushPayload): Promise<FlushResult> {
    // 1. Deduplicate incoming sales by local_id (idempotent)
    // 2. Begin transaction
    // 3. Insert sales, items, payments
    // 4. Adjust inventory (apply stock deductions in created_at order)
    // 5. Queue eTIMS submissions for each new sale
    // 6. Return eTIMS results + fresh price/stock snapshot
    // 7. Commit transaction
  }
}
```

### 5.4 Service Worker Sync

```javascript
// Background sync via Service Worker
self.addEventListener('sync', (event) => {
  if (event.tag === 'flush-offline-sales') {
    event.waitUntil(flushOfflineSales())
  }
})

async function flushOfflineSales() {
  const db = await openDB()
  const pending = await db.getAll('syncQueue', IDBKeyRange.only('pending'))
  if (pending.length === 0) return
  
  const response = await fetch('/api/v1/sync/flush', {
    method: 'POST',
    body: JSON.stringify(pending),
    headers: { 'Content-Type': 'application/json' }
  })
  
  if (response.ok) {
    const result = await response.json()
    await markSynced(db, result.processed)
  }
}
```

---

## 6. M-Pesa Integration

### 6.1 Integration Pattern

```
Cashier enters amount
        │
        ▼
POST /api/v1/payments/mpesa/stk-push
{ phone: "2547XXXXXXXX", amount: 1500, saleLocalId: "..." }
        │
        ▼
MpesaService.stkPush()
  → POST https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest
        │
        ▼
Safaricom sends STK prompt to customer's phone
Customer enters M-Pesa PIN
        │
        ▼
Safaricom POSTs callback to:
POST /api/v1/webhooks/mpesa/stk-callback
{ Body.stkCallback.ResultCode: 0, ... }
        │
        ▼
MpesaService.handleCallback()
  → Update payment record: status = confirmed, reference = MpesaReceiptNumber
  → WebSocket push to POS terminal: { event: 'payment_confirmed', saleLocalId }
  → POS auto-completes sale and prints receipt
```

### 6.2 Daraja API Configuration

```typescript
// lib/mpesa.ts
interface DarajaConfig {
  consumerKey: string        // From Safaricom Developer Portal
  consumerSecret: string
  businessShortCode: string  // Till or Paybill number
  passkey: string            // From Daraja portal (for STK Push)
  callbackUrl: string        // Must be publicly accessible HTTPS URL
  environment: 'sandbox' | 'production'
}

class MpesaService {
  private baseUrl: string
  
  async getAccessToken(): Promise<string> {
    const credentials = Buffer.from(`${this.config.consumerKey}:${this.config.consumerSecret}`).toString('base64')
    const res = await axios.get(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${credentials}` }
    })
    return res.data.access_token
  }

  async stkPush(params: { phone: string; amount: number; reference: string; description: string }): Promise<StkPushResponse> {
    const token = await this.getAccessToken()
    const timestamp = format(new Date(), 'yyyyMMddHHmmss')
    const password = Buffer.from(`${this.config.businessShortCode}${this.config.passkey}${timestamp}`).toString('base64')
    
    return axios.post(`${this.baseUrl}/mpesa/stkpush/v1/processrequest`, {
      BusinessShortCode: this.config.businessShortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline', // or CustomerBuyGoodsOnline for Till
      Amount: Math.ceil(params.amount),          // M-Pesa requires integer amounts
      PartyA: params.phone,
      PartyB: this.config.businessShortCode,
      PhoneNumber: params.phone,
      CallBackURL: this.config.callbackUrl,
      AccountReference: params.reference,
      TransactionDesc: params.description
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
  }

  async handleCallback(payload: MpesaCallback): Promise<void> {
    const { ResultCode, MpesaReceiptNumber, Amount, TransactionDate } = payload.Body.stkCallback
    
    if (ResultCode !== 0) {
      // Payment failed or cancelled
      await this.markPaymentFailed(payload.Body.stkCallback.CheckoutRequestID, ResultCode)
      return
    }
    
    await db.payments.update({ 
      checkoutRequestId: payload.Body.stkCallback.CheckoutRequestID 
    }, {
      status: 'confirmed',
      mpesaReceipt: MpesaReceiptNumber,
      amount: Amount,
      confirmedAt: new Date()
    })
    
    // Notify POS terminal via WebSocket
    await this.notifyTerminal(MpesaReceiptNumber)
  }
}
```

### 6.3 STK Push Timeout Handling

- STK Push expires after **60 seconds** if customer does not respond
- POS shows 60-second countdown; on timeout, shows retry / fallback to cash options
- CheckoutRequestID stored in Redis with 90-second TTL to match callbacks to pending sales

---

## 7. KRA eTIMS Integration

### 7.1 Integration Mode: VSCU (Virtual Sales Control Unit)

The system registers as a VSCU — real-time submission where possible, batch fallback when offline.

```typescript
// services/EtimsService.ts
interface EtimsInvoice {
  invoiceNumber: string
  invoiceDate: string           // ISO 8601
  customerPin?: string          // B2B customers with KRA PIN
  items: EtimsLineItem[]
  vatAmount: number
  exemptAmount: number
  totalAmount: number
  paymentMode: 'CASH' | 'MPESA' | 'BANK' | 'CREDIT'
  mpesaCode?: string
}

interface EtimsLineItem {
  itemCode: string
  itemName: string
  quantity: number
  unitPrice: number
  vatCategory: 'A' | 'B' | 'C'  // A=standard 16%, B=exempt 0%, C=zero-rated
  vatAmount: number
  lineTotal: number
}

class EtimsService {
  async submitInvoice(sale: Sale): Promise<EtimsResult> {
    const invoice = this.buildInvoice(sale)
    
    try {
      const response = await axios.post(`${this.config.baseUrl}/invoices`, invoice, {
        headers: { 
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-Device-Serial': this.config.cuSerial
        },
        timeout: 10000
      })
      
      return {
        status: 'confirmed',
        cuSerial: response.data.cuSerial,
        invoiceNumber: response.data.invoiceNumber,
        validationCode: response.data.validationCode,
        qrData: response.data.qrData
      }
    } catch (err) {
      // Queue for retry via BullMQ
      await etimsQueue.add('retry', { saleId: sale.id, invoice }, {
        attempts: 5,
        backoff: { type: 'exponential', delay: 60000 }
      })
      return { status: 'queued' }
    }
  }

  buildQrData(result: EtimsResult): string {
    // KRA specifies QR content format
    return `https://itax.kra.go.ke/KRA-Portal/invoiceChecker.html?actionCode=loadPage&invoiceNo=${result.invoiceNumber}`
  }
}
```

### 7.2 VAT Categorisation Logic

```typescript
function getVatCategory(product: Product): 'A' | 'B' {
  // Books: VAT-exempt (Category B)
  if (product.category === 'BOOKS' || product.isbnPresent) return 'B'
  
  // Stationery, electronics, services: standard rated (Category A — 16%)
  return 'A'
}

function calculateLineTotals(items: CartItem[]) {
  return items.map(item => {
    const vatCat = getVatCategory(item.product)
    const vatRate = vatCat === 'A' ? 0.16 : 0
    const lineTotal = item.quantity * item.unitPrice - item.discount
    const vatAmount = vatCat === 'A' ? lineTotal * vatRate / (1 + vatRate) : 0
    return { ...item, vatCategory: vatCat, vatAmount, lineTotal }
  })
}
```

---

## 8. Authentication & Security

### 8.1 JWT Architecture

```typescript
// Token structure
interface AccessTokenPayload {
  sub: string         // user ID
  tenantId: string    // shop ID
  branchId: string    // active branch
  role: Role
  permissions: string[]
  iat: number
  exp: number         // 15 minutes
}

interface RefreshTokenPayload {
  sub: string
  tokenFamily: string  // Rotation family for theft detection
  iat: number
  exp: number          // 30 days
}
```

### 8.2 Token Refresh Flow

- Access token: 15-minute expiry
- Refresh token: 30-day expiry, stored in `httpOnly` secure cookie
- Refresh token rotation: each use issues a new refresh token; old one invalidated
- Refresh token families stored in Redis; family invalidated on theft detection

### 8.3 Password Security

```typescript
// Bcrypt with cost factor 12
const BCRYPT_ROUNDS = 12

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

// Minimum requirements enforced at Zod layer:
const passwordSchema = z.string()
  .min(8)
  .regex(/[A-Z]/, 'Must contain uppercase')
  .regex(/[0-9]/, 'Must contain number')
```

### 8.4 Rate Limiting

```typescript
// Redis-backed rate limiter per endpoint
const rateLimits = {
  '/auth/login':          { windowMs: 60000, max: 5 },
  '/payments/mpesa/stk':  { windowMs: 60000, max: 20 },
  '/api/v1/*':            { windowMs: 60000, max: 300 }
}
```

### 8.5 Security Checklist

- [ ] All routes require authentication except `/auth/login`, `/auth/refresh`, `/webhooks/mpesa`
- [ ] Webhook endpoints (M-Pesa callback) validated with HMAC signature or IP whitelist (Safaricom IPs)
- [ ] SQL: Prisma parameterised queries only; no raw string interpolation
- [ ] All environment secrets in `.env` (never committed); production via secrets manager
- [ ] CORS: whitelist specific origins only
- [ ] Helmet.js for HTTP security headers
- [ ] Dependency scanning: `npm audit` in CI pipeline
- [ ] Database: AES-256 encryption at rest; TLS in transit
- [ ] M-Pesa API credentials stored in encrypted secrets; rotated every 90 days

---

## 9. Receipt & Printing System

### 9.1 Receipt Generation

```typescript
// lib/printer.ts
interface ReceiptData {
  shop: ShopProfile
  sale: Sale
  items: SaleItem[]
  payments: Payment[]
  etims: EtimsResult | null
  cashier: string
  customer?: Customer
}

function buildEscPosReceipt(data: ReceiptData): Uint8Array {
  const encoder = new ReceiptPrinterEncoder({ language: 'esc-pos', width: 42 })

  return encoder
    .initialize()
    .align('center')
    .bold(true).text(data.shop.name).newline()
    .bold(false).text(data.shop.address).newline()
    .text(`Tel: ${data.shop.phone}`).newline()
    .text(`KRA PIN: ${data.shop.kraPin}`).newline()
    .rule()
    .align('left')
    .text(`Date: ${format(data.sale.createdAt, 'dd/MM/yyyy HH:mm')}`).newline()
    .text(`Receipt: ${data.sale.receiptNumber}`).newline()
    .text(`Cashier: ${data.cashier}`).newline()
    .rule()
    // Line items
    ...data.items.map(item => encoder
      .text(truncate(item.product.name, 28)).newline()
      .text(`  ${item.quantity} x ${formatKES(item.unitPrice)}`).align('right').text(formatKES(item.lineTotal)).newline()
    )
    .rule()
    .text('Subtotal').align('right').text(formatKES(data.sale.subtotal)).newline()
    .text('VAT (16%)').align('right').text(formatKES(data.sale.vatAmount)).newline()
    .bold(true).text('TOTAL').align('right').text(formatKES(data.sale.total)).bold(false).newline()
    .rule()
    // Payment lines
    ...data.payments.map(p => encoder
      .text(p.method.toUpperCase()).align('right').text(formatKES(p.amount)).newline()
      ...(p.mpesaReceipt ? [encoder.text(`  Ref: ${p.mpesaReceipt}`).newline()] : [])
    )
    .rule()
    // eTIMS section
    .align('center')
    .text(data.etims ? `KRA CU: ${data.etims.cuSerial}` : 'eTIMS: PENDING').newline()
    .text(data.etims ? `INV: ${data.etims.invoiceNumber}` : '').newline()
    ...(data.etims ? [encoder.qrcode(data.etims.qrData, 1, 8)] : [])
    .newline().newline().newline()
    .cut()
    .encode()
}
```

### 9.2 Cash Drawer Trigger

```typescript
// Cash drawer is triggered via printer's RJ11 port using ESC/POS pulse command
function openCashDrawer(encoder: ReceiptPrinterEncoder): Uint8Array {
  return encoder
    .raw([0x1B, 0x70, 0x00, 0x19, 0xFA])  // ESC p pin duration1 duration2
    .encode()
}
```

### 9.3 Bluetooth Printer (Android)

For Android tablet deployments, use the **Web Bluetooth API** (Chrome/Android only):

```typescript
async function connectBluetoothPrinter(): Promise<BluetoothDevice> {
  const device = await navigator.bluetooth.requestDevice({
    filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }]
  })
  const server = await device.gatt!.connect()
  const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb')
  const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb')
  return characteristic  // Write ESC/POS bytes to this characteristic
}
```

---

## 10. SMS & Notifications

### 10.1 Africa's Talking Integration

```typescript
// services/SmsService.ts
import AfricasTalking from 'africastalking'

const AT = AfricasTalking({
  apiKey: process.env.AT_API_KEY!,
  username: process.env.AT_USERNAME!    // shortcode or alphanumeric sender
})

class SmsService {
  async sendReceipt(phone: string, sale: Sale, etims: EtimsResult): Promise<void> {
    const message = [
      `${sale.shop.name} - Risiti`,
      `Tarehe: ${format(sale.createdAt, 'dd/MM/yyyy HH:mm')}`,
      `Jumla: KES ${sale.total.toFixed(2)}`,
      sale.payments.find(p => p.method === 'mpesa')?.mpesaReceipt 
        ? `M-Pesa: ${sale.payments.find(p => p.method === 'mpesa')!.mpesaReceipt}` 
        : '',
      etims ? `KRA: ${etims.invoiceNumber}` : '',
      `Asante kwa kununua!`
    ].filter(Boolean).join('\n')

    await AT.SMS.send({ to: [phone], message, from: 'DUKA-POS' })
  }

  async sendLowStockAlert(owner: User, alerts: LowStockAlert[]): Promise<void> {
    const message = [
      `TAHADHARI - Bidhaa Kidogo:`,
      ...alerts.slice(0, 5).map(a => `• ${a.productName}: ${a.quantity} zimebaki`),
      alerts.length > 5 ? `...na ${alerts.length - 5} zaidi` : ''
    ].filter(Boolean).join('\n')

    await AT.SMS.send({ to: [owner.phone], message, from: 'DUKA-POS' })
  }
}
```

### 10.2 Notification Schedule (node-cron)

```typescript
// jobs/scheduled.ts
// Daily: low-stock digest to owner (8 AM)
cron.schedule('0 8 * * *', async () => {
  const tenants = await getAllActiveTenants()
  for (const tenant of tenants) {
    const alerts = await getLowStockAlerts(tenant.id)
    if (alerts.length > 0) await smsService.sendLowStockAlert(tenant.owner, alerts)
  }
})

// Daily: overdue debt reminders (9 AM, configurable per tenant)
cron.schedule('0 9 * * *', async () => {
  const overdueAccounts = await getOverdueCustomers()
  for (const account of overdueAccounts) {
    await smsService.sendDebtReminder(account.customer, account.outstandingAmount, account.daysOverdue)
  }
})

// Daily backup (2 AM)
cron.schedule('0 2 * * *', async () => {
  await backupService.runFullBackup()
})
```

---

## 11. API Reference

### 11.1 Authentication

```
POST   /api/v1/auth/login              Login; returns access + refresh tokens
POST   /api/v1/auth/refresh            Refresh access token
POST   /api/v1/auth/logout             Invalidate refresh token
POST   /api/v1/auth/change-password    Change own password
```

### 11.2 Sales

```
POST   /api/v1/sales                   Create/complete a sale
GET    /api/v1/sales                   List sales (paginated, filterable)
GET    /api/v1/sales/:id               Get sale details
POST   /api/v1/sales/:id/void          Void a sale (manager+ only)
GET    /api/v1/sales/:id/receipt       Get receipt data for reprinting
```

### 11.3 Products

```
GET    /api/v1/products                List products (with search, barcode lookup)
POST   /api/v1/products                Create product
PUT    /api/v1/products/:id            Update product
GET    /api/v1/products/isbn/:isbn     Lookup by ISBN (hits local DB + Open Library fallback)
GET    /api/v1/products/barcode/:code  Lookup by barcode
```

### 11.4 Inventory

```
GET    /api/v1/inventory               Stock levels (all products, per branch)
POST   /api/v1/inventory/grn           Record goods receipt
POST   /api/v1/inventory/adjustment    Record stock adjustment (with reason)
POST   /api/v1/inventory/transfer      Inter-branch stock transfer
POST   /api/v1/inventory/stocktake     Submit physical count; get variance report
GET    /api/v1/inventory/low-stock     Products below reorder point
```

### 11.5 Payments

```
POST   /api/v1/payments/mpesa/stk-push   Initiate M-Pesa STK Push
GET    /api/v1/payments/mpesa/status/:id  Check STK status
POST   /api/v1/webhooks/mpesa/callback   Safaricom STK callback (public)
POST   /api/v1/webhooks/mpesa/c2b        Safaricom C2B callback (public)
```

### 11.6 Sync

```
POST   /api/v1/sync/flush              Batch upload offline transactions
GET    /api/v1/sync/snapshot           Full product+price snapshot for offline cache
GET    /api/v1/sync/status             Check if device has pending conflicts
```

### 11.7 Reports

```
GET    /api/v1/reports/daily-summary         Today's sales summary
GET    /api/v1/reports/reconciliation        EOD reconciliation (cash variance)
GET    /api/v1/reports/sales-by-product      Sales by SKU
GET    /api/v1/reports/sales-by-cashier      Per-cashier performance
GET    /api/v1/reports/credit-outstanding    Pending debts report
GET    /api/v1/reports/etims-compliance      eTIMS submission status report
GET    /api/v1/reports/export                Export any report as CSV
```

---

## 12. Infrastructure & DevOps

### 12.1 Docker Compose (Development)

```yaml
version: '3.9'
services:
  api:
    build: ./apps/api
    environment:
      DATABASE_URL: postgresql://pos:pos@db:5432/dukalavitabu
      REDIS_URL: redis://redis:6379
    ports: ["3001:3001"]
    depends_on: [db, redis]

  web:
    build: ./apps/web
    ports: ["3000:80"]

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: dukalavitabu
      POSTGRES_USER: pos
      POSTGRES_PASSWORD: pos
    volumes: ["pgdata:/var/lib/postgresql/data"]
    ports: ["5432:5432"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

volumes:
  pgdata:
```

### 12.2 Production Environment Variables

```bash
# API Server
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_URL=rediss://...
JWT_ACCESS_SECRET=<256-bit secret>
JWT_REFRESH_SECRET=<256-bit secret>

# M-Pesa
MPESA_CONSUMER_KEY=...
MPESA_CONSUMER_SECRET=...
MPESA_PASSKEY=...
MPESA_SHORTCODE=...
MPESA_CALLBACK_URL=https://api.dukalavitabu.co.ke/webhooks/mpesa

# KRA eTIMS
ETIMS_BASE_URL=https://etims-api.kra.go.ke
ETIMS_API_KEY=...
ETIMS_CU_SERIAL=...

# Africa's Talking
AT_API_KEY=...
AT_USERNAME=...

# Storage
B2_BUCKET=...
B2_KEY_ID=...
B2_APP_KEY=...
```

### 12.3 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test
      - run: npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy API
        run: railway up --service api
      - name: Deploy Web
        run: railway up --service web
```

---

## 13. Performance Targets

| Operation | Target | Method |
|---|---|---|
| Product barcode lookup (online) | < 100ms | Redis cache → PostgreSQL fallback |
| Product barcode lookup (offline) | < 50ms | Dexie.js IndexedDB |
| Sale creation (API) | < 300ms | Single DB transaction |
| STK Push initiation | < 500ms | Direct Daraja call |
| STK Push customer confirmation | 5–30s | Customer action |
| Receipt print | < 2s | ESC/POS buffered write |
| Offline queue flush (100 sales) | < 10s | Batch API call |
| Daily report generation | < 5s | Pre-aggregated views |
| Full product snapshot download | < 30s | Compressed JSON, ~2MB for 10K SKUs |

---

## 14. Error Handling Strategy

### 14.1 Error Types and Responses

```typescript
// Standardised error format
interface ApiError {
  code: string        // Machine-readable: 'PRODUCT_NOT_FOUND', 'MPESA_TIMEOUT'
  message: string     // Human-readable (English)
  messageKe?: string  // Swahili translation where relevant
  details?: unknown   // Additional context
}

// HTTP status mapping
const ERROR_STATUS_MAP: Record<string, number> = {
  UNAUTHORIZED:         401,
  FORBIDDEN:            403,
  NOT_FOUND:            404,
  VALIDATION_ERROR:     422,
  MPESA_TIMEOUT:        408,
  ETIMS_UNAVAILABLE:    503,
  CONFLICT:             409,
  INTERNAL:             500
}
```

### 14.2 Critical Path Failures

| Failure | Behaviour |
|---|---|
| M-Pesa API down | Fall back to cash; display clear message; log incident |
| eTIMS API down | Queue invoice; continue sale; display "eTIMS pending" on receipt |
| Database unreachable | Serve from Redis cache; queue writes; alert ops |
| Internet down (client) | Full offline mode; no M-Pesa STK; cash only |
| Receipt printer offline | Sale completes; offer to print when printer reconnects; offer SMS receipt |

---

## 15. Testing Strategy

### 15.1 Test Coverage Requirements

| Layer | Tool | Min Coverage |
|---|---|---|
| Backend unit tests | Vitest | 80% |
| API integration tests | Supertest | All endpoints |
| Frontend component tests | Vitest + React Testing Library | 70% |
| E2E checkout flow | Playwright | Full happy path + offline scenario |
| M-Pesa integration | Daraja Sandbox + mocks | STK Push + callback |
| eTIMS integration | KRA sandbox | Submit + validate |

### 15.2 Critical Test Scenarios

```
□ Full checkout: scan → cart → STK Push → confirmation → receipt print
□ Offline sale: disconnect network → complete sale → reconnect → auto-sync → eTIMS code appears
□ Void transaction: cashier cannot void → manager PINs → void logged in audit
□ Duplicate M-Pesa reference rejected (idempotency)
□ Credit sale against school account: balance updates correctly
□ Mixed VAT basket: books (0%) + stationery (16%) → correct eTIMS line items
□ Low stock alert fires when reorder point crossed
□ Role enforcement: cashier cannot access /reports/financial
□ Offline > 72 hours → conflict alert shown
□ STK Push timeout (60s) → retry prompt shown
```

---

*End of Technical Specification*

---

> **Document Owner:** Engineering Team  
> **Review Cycle:** Each sprint  
> **Related Docs:** PRD.md, UX_SPEC.md

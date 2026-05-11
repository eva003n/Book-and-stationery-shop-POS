# UX Specification
## Duka la Vitabu — Kenya Bookshop & Stationery POS System

> **Version:** 1.0  
> **Status:** Draft  
> **Owner:** Design Team  
> **Last Updated:** May 2026  
> **Classification:** Internal — Design

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Design System](#2-design-system)
3. [User Journeys](#3-user-journeys)
4. [Screen Specifications](#4-screen-specifications)
5. [Interaction Patterns](#5-interaction-patterns)
6. [Offline UX](#6-offline-ux)
7. [M-Pesa Payment UX](#7-m-pesa-payment-ux)
8. [Receipt & Print UX](#8-receipt--print-ux)
9. [Mobile & Responsive Behaviour](#9-mobile--responsive-behaviour)
10. [Localisation (English / Swahili)](#10-localisation-english--swahili)
11. [Accessibility](#11-accessibility)
12. [Error States & Empty States](#12-error-states--empty-states)
13. [Onboarding Flow](#13-onboarding-flow)
14. [Hardware Integration UX](#14-hardware-integration-ux)
15. [Component Library Reference](#15-component-library-reference)

---

## 1. Design Philosophy

### 1.1 Core Principles

**1. Speed above all at the counter**
The cashier's primary job is serving the next customer. Every screen used during a sale must be operable with minimal thought — 0 decisions where possible, 1 decision maximum. Checkout UI must be operable by an untrained person within 5 minutes of first use.

**2. Confidence without complexity**
The owner's primary need is to trust the numbers. Reports and dashboards should be immediately legible — no jargon, no buried charts, no ambiguous totals. Every number must have an obvious label and a clear time frame.

**3. Offline is normal, not an exception**
In Kenya's connectivity environment, offline operation is a design-first concern, not an edge case. The UI communicates connectivity status at all times without making it alarming. Offline mode feels native, not degraded.

**4. Built for Kenya**
The design speaks Kenyan context: KES currency, M-Pesa as a first-class payment method (not an add-on), Swahili labels where users prefer them, and a visual style that feels local — not a generic SaaS template imported from a US company.

**5. Trust through transparency**
KRA compliance, M-Pesa confirmation codes, and audit trails must be visible and unambiguous. The system makes it easy to be honest and hard to commit fraud — this is a core feature, not just security.

### 1.2 Design Anti-Patterns to Avoid

- No nested menus more than 2 levels deep in the checkout flow
- No modals on top of modals
- No destructive actions (void, delete) accessible with a single click
- No loading spinners without progress indication for operations > 2 seconds
- No English-only UI for staff-facing screens

---

## 2. Design System

### 2.1 Colour Palette

```
Primary:    Forest Green   #1B4332  ← evokes education, trust, Kenya
Accent:     Safaricom Green #00A651  ← M-Pesa association; CTAs
Warm White: #F9F6F0                  ← Receipt background; clean
Surface:    #FFFFFF
Background: #F4F6F5
Border:     #D1D9D3

Status:
  Success:  #2D6A4F   (darker green — confirmed payments)
  Warning:  #E9A23B   (amber — low stock, pending eTIMS)
  Error:    #C0392B   (red — void, failure, offline M-Pesa)
  Info:     #2980B9   (blue — informational alerts)

Text:
  Primary:    #1A1A1A
  Secondary:  #555F57
  Disabled:   #9CA89C
  On-dark:    #FFFFFF
```

### 2.2 Typography

```
Heading font:  Inter (700/600 weight) — clean, readable on any screen
Body font:     Inter (400/500 weight)
Mono font:     JetBrains Mono — receipt preview, codes, amounts

Scale:
  h1: 28px / 34px line-height
  h2: 22px / 28px
  h3: 18px / 24px
  body: 15px / 22px
  small: 13px / 18px
  label: 11px / 16px (uppercase, letter-spacing 0.05em)
  
  Amount display (large): 36px / bold — critical for cash amounts at counter
```

### 2.3 Spacing System

Base unit: 4px  
Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96px  
Touch targets: minimum 44px × 44px (iOS HIG / WCAG 2.5.5)

### 2.4 Border Radius

- Cards: 8px
- Buttons: 6px
- Inputs: 6px
- Modals: 12px
- Chips/tags: 20px (pill)
- Product card: 8px

### 2.5 Elevation / Shadow

```
Level 0: No shadow (flat, embedded)
Level 1: 0 1px 3px rgba(0,0,0,0.08)  ← cards, input fields
Level 2: 0 4px 12px rgba(0,0,0,0.12) ← dropdowns, tooltips
Level 3: 0 8px 24px rgba(0,0,0,0.16) ← modals, drawers
```

### 2.6 Iconography

Library: Lucide Icons (consistent weight, open source)  
Size: 16px (inline), 20px (list), 24px (navigation), 32px (empty states)  
Stroke width: 1.5px  
No filled icons in navigation — reserved for active state only

---

## 3. User Journeys

### 3.1 Primary Journey: Walk-in Sale (Cash)

```
Customer enters shop
         │
         ▼
Cashier opens POS (already logged in from shift start)
         │
         ▼
[CHECKOUT SCREEN — default view]
Cashier scans barcode OR types product name
         │
         ├──> Product found → added to cart automatically
         │    Cart shows: name, qty, unit price, line total
         │
         ├──> Product not found → "Not found" message
         │    Cashier can search by name or enter manually
         │
         ▼
All items scanned → cashier reviews cart
         │
         ▼
Cashier selects "Cash" payment → enters amount tendered
System shows change due instantly
         │
         ▼
"Complete Sale" button → 
  - Receipt prints automatically (< 2s)
  - Cash drawer opens
  - Cart clears
  - eTIMS submitted in background
         │
         ▼
Ready for next customer
```

**Time target:** < 45 seconds from first scan to receipt print

### 3.2 Primary Journey: M-Pesa STK Push

```
[CHECKOUT SCREEN]
Cart ready → cashier selects "M-Pesa" payment
         │
         ▼
[M-PESA MODAL]
Phone number field — auto-populated if known customer
Amount field — pre-filled from cart total
Cashier taps "Send Payment Request"
         │
         ▼
[WAITING STATE — 60s countdown]
"Payment request sent to 0712 XXX XXX"
Animated countdown ring
"Waiting for customer to confirm..."
         │
         ├──> Customer enters PIN → [CONFIRMED] green checkmark
         │    Receipt auto-prints; M-Pesa code shown on screen
         │
         ├──> Customer cancels → [CANCELLED] — retry or switch method
         │
         └──> Timeout (60s) → [TIMEOUT] — retry or switch method
```

### 3.3 Secondary Journey: School Credit Sale

```
[CHECKOUT SCREEN]
Cashier searches and adds items to cart
         │
         ▼
Cashier selects customer (school) from CRM search
Customer credit balance shown: "Outstanding: KES 12,400 / Limit: KES 50,000"
         │
         ▼
Cashier selects "Credit" as payment method
LPO number field appears (optional reference)
         │
         ▼
"Complete Credit Sale" → 
  - Invoice generated and printed
  - Customer credit balance updated
  - eTIMS submitted
  - Statement of account can be printed immediately
```

### 3.4 Owner Journey: Morning Dashboard Check

```
Owner opens app on Android phone (5 min after opening time)
         │
         ▼
[DASHBOARD — mobile view]
Shows:
  - Yesterday's total: KES 18,450
  - This week vs last week: ▲ 12%
  - Low stock alerts: 3 items
  - Outstanding debts: KES 87,000 from 4 schools
  - eTIMS status: ✓ All submitted
         │
         ▼
Owner taps "Low Stock" → 
  [LIST] Form 3 Biology × 2 units, Comix 96pg × 8 pkts, Bic Pens × 15 pcs
  "Generate Purchase Order" button → PO ready to WhatsApp to supplier
```

---

## 4. Screen Specifications

### 4.1 Checkout Screen (Primary POS View)

**Layout:** Two-column on desktop (product search left, cart right)  
**Breakpoint:** Single column on tablet/phone

```
┌─────────────────────────────────────────────────────────┐
│  ☰  Duka la Vitabu          Brian ▾    🟢 Online  10:34 │
├──────────────────────────┬──────────────────────────────┤
│  PRODUCT SEARCH          │  CART                        │
│                          │                              │
│  🔍 [Scan or search...] │  3 items                     │
│                          │                              │
│  ┌────────────────────┐  │  ┌────────────────────────┐ │
│  │ 📚 Form 3 Biology  │  │  │ Form 3 Biology     x1  │ │
│  │ KES 650  · 14 in   │  │  │ KES 650         KES 650│ │
│  │ stock              │  │  ├────────────────────────┤ │
│  └────────────────────┘  │  │ Exercise Book 96pg x3  │ │
│                          │  │ KES 45          KES 135│ │
│  ┌────────────────────┐  │  ├────────────────────────┤ │
│  │ 📗 Form 3 Maths    │  │  │ Bic Biro (Blue)    x2  │ │
│  │ KES 580  · 6 in    │  │  │ KES 25           KES 50│ │
│  │ stock              │  │  └────────────────────────┘ │
│  └────────────────────┘  │                              │
│                          │  ──────────────────────────  │
│  [Quick category tabs]   │  Subtotal         KES  835  │
│  All  Books  Stationery  │  VAT (16%)         KES   7  │
│  Services  Electronics   │  ──────────────────────────  │
│                          │  TOTAL            KES  842  │
│                          │                              │
│                          │  [DISCOUNT]    [CUSTOMER]   │
│                          │                              │
│                          │  ╔════════════════════════╗ │
│                          │  ║      PAY  KES 842      ║ │
│                          │  ╚════════════════════════╝ │
└──────────────────────────┴──────────────────────────────┘
```

**Key interactions:**
- Barcode scan auto-focuses search field and adds immediately
- Each cart item: tap to change quantity; swipe/long-press to remove
- "Customer" button opens inline customer search (for credit/loyalty)
- "PAY" button opens payment method selector

### 4.2 Payment Method Selector

```
┌─────────────────────────────────────────┐
│  How is the customer paying?            │
│                                         │
│  ┌─────────────┐  ┌─────────────────┐  │
│  │  💵  CASH   │  │  📱  M-PESA STK │  │
│  │             │  │                 │  │
│  │  Enter      │  │  Send prompt to │  │
│  │  amount     │  │  customer phone │  │
│  └─────────────┘  └─────────────────┘  │
│                                         │
│  ┌─────────────┐  ┌─────────────────┐  │
│  │  🏦  BANK   │  │  📋  CREDIT     │  │
│  │  TRANSFER   │  │  (Account)      │  │
│  │             │  │                 │  │
│  └─────────────┘  └─────────────────┘  │
│                                         │
│  [SPLIT PAYMENT — combine two methods]  │
└─────────────────────────────────────────┘
```

### 4.3 Cash Payment Screen

```
┌─────────────────────────────────────────┐
│  Cash Payment                       ✕   │
│                                         │
│  TOTAL DUE                              │
│  ┌─────────────────────────────────┐   │
│  │         KES 842.00              │   │
│  └─────────────────────────────────┘   │
│                                         │
│  AMOUNT TENDERED                        │
│  ┌─────────────────────────────────┐   │
│  │  KES  [    1,000    ]           │   │
│  └─────────────────────────────────┘   │
│                                         │
│  CHANGE DUE                             │
│  ┌─────────────────────────────────┐   │
│  │         KES 158.00              │   │   ← large, green, bold
│  └─────────────────────────────────┘   │
│                                         │
│  Quick amounts: [500] [1,000] [2,000]  │
│                                         │
│  ╔═══════════════════════════════════╗ │
│  ║   ✓  COMPLETE SALE & PRINT        ║ │
│  ╚═══════════════════════════════════╝ │
└─────────────────────────────────────────┘
```

### 4.4 M-Pesa Waiting Screen

```
┌─────────────────────────────────────────┐
│  M-Pesa Payment                     ✕   │
│                                         │
│         ┌─────────────────┐             │
│         │   ████████████  │             │  ← animated countdown ring
│         │   ██  45s  ████ │             │     green → amber → red
│         │   ████████████  │             │
│         └─────────────────┘             │
│                                         │
│      KES 842.00                         │
│                                         │
│  📱 Prompt sent to                      │
│     0712 XXX XXX                        │
│                                         │
│  Ask customer to:                       │
│  1. Check their M-Pesa prompt           │
│  2. Enter their M-Pesa PIN              │
│                                         │
│  ─────────────────────────────────────  │
│  [Change number]    [Cancel — use cash] │
└─────────────────────────────────────────┘
```

**On confirmation:**
```
┌─────────────────────────────────────────┐
│                                         │
│         ╔═══════════════════╗           │
│         ║   ✅ CONFIRMED    ║           │   ← green pulse animation
│         ╚═══════════════════╝           │
│                                         │
│     KES 842.00 received                 │
│     M-Pesa Code: QFH7K2X901           │
│                                         │
│     Printing receipt...                 │
│                                         │
└─────────────────────────────────────────┘
```
Auto-dismisses in 2 seconds; receipt prints; cart clears.

### 4.5 Owner Dashboard (Desktop)

```
┌────────────────────────────────────────────────────────────┐
│  Duka la Vitabu          Wanjiku ▾              May 10 ✦  │
├─────────────┬──────────────────────────────────────────────┤
│             │                                              │
│  NAV        │  TODAY                                       │
│             │  ┌──────────┐ ┌──────────┐ ┌─────────────┐  │
│  Dashboard  │  │KES 24,850│ │   87     │ │  KES 4,200  │  │
│  Checkout   │  │Revenue   │ │ Sales    │ │  Gross Profit│ │
│  Inventory  │  └──────────┘ └──────────┘ └─────────────┘  │
│  Customers  │                                              │
│  Suppliers  │  SALES THIS WEEK                            │
│  Reports    │  ┌─────────────────────────────────────┐   │
│  Settings   │  │  ▄  ▄  ▄  █  ▄  ▄                 │   │
│             │  │Mon Tue Wed Thu Fri Sat               │   │
│             │  └─────────────────────────────────────┘   │
│  🔴 3 LOW   │                                              │
│  STOCK      │  ⚠️  LOW STOCK ALERTS                       │
│             │  • Form 3 Biology — 2 units left            │
│  ✓ eTIMS   │  • Exercise Book 96pg — 8 packets left      │
│  All OK     │  • Bic Biro Blue — 15 pcs left              │
│             │  [Create Purchase Order]                    │
│             │                                              │
│             │  💳  OUTSTANDING CREDIT                     │
│             │  Muranga High School  KES 23,400   45 days  │
│             │  Thika Girls          KES 18,750   32 days  │
│             │  [View All 4 Accounts]                      │
└─────────────┴──────────────────────────────────────────────┘
```

### 4.6 Inventory Screen

```
┌────────────────────────────────────────────────────────────┐
│  Inventory               [+ Add Product]  [Stocktake]     │
├─────────────────────────────────────────────────────────────┤
│  🔍 Search products...    Category ▾   Status ▾   Sort ▾  │
├─────────────────────────────────────────────────────────────┤
│  NAME                 SKU       STOCK   PRICE    STATUS     │
│  ────────────────────────────────────────────────────────   │
│  Form 3 Biology       BIO-F3    14      KES 650  ✓ OK      │
│  Exercise Book 96pg   EB-96-CM  8       KES 45   ⚠ Low     │ ← amber row
│  Form 3 Mathematics   MTH-F3    6       KES 580  ✓ OK      │
│  Bic Biro Blue        PEN-BB    15      KES 25   ⚠ Low     │
│  Form 2 Kiswahili     KSW-F2    0       KES 420  🔴 Out    │ ← red row
│  A4 Printer Paper RM  PAP-A4    42      KES 550  ✓ OK      │
│  ────────────────────────────────────────────────────────   │
│  Showing 6 of 1,247 products                               │
└─────────────────────────────────────────────────────────────┘
```

### 4.7 Customer Account Screen

```
┌────────────────────────────────────────────────────────────┐
│  ← Customers   Muranga High School                        │
├─────────────────────────────────────────────────────────────┤
│  Type: School     Phone: 0722 123 456    KRA: P051234567K  │
│  Credit Limit: KES 50,000                                  │
│                                                            │
│  ┌─────────────────────────────────────────────┐          │
│  │  OUTSTANDING BALANCE                        │          │
│  │  KES 23,400                  45 days overdue│          │
│  └─────────────────────────────────────────────┘          │
│                                                            │
│  [Record Payment]   [Print Statement]   [Send Reminder]   │
│                                                            │
│  TRANSACTION HISTORY                                       │
│  ─────────────────────────────────────────────────────    │
│  15 Apr 2026  Invoice #1042   KES 18,500   Credit  Unpaid │
│  02 Mar 2026  Payment         KES 10,000   Cash    Paid   │
│  28 Feb 2026  Invoice #0987   KES 15,400   LPO     Unpaid │
│                               LPO: MHS/2026/034           │
│  15 Jan 2026  Invoice #0921   KES 24,300   LPO     Paid   │
└────────────────────────────────────────────────────────────┘
```

### 4.8 End-of-Day Reconciliation Screen

```
┌────────────────────────────────────────────────────────────┐
│  End of Day — May 10, 2026             Cashier: Brian     │
├─────────────────────────────────────────────────────────────┤
│  SYSTEM TOTALS                                             │
│  ─────────────────────────────────────────────────────    │
│  Cash sales                              KES  14,200      │
│  M-Pesa sales                            KES   8,650      │
│  Credit sales                            KES   2,000      │
│  Total sales                             KES  24,850      │
│  ─────────────────────────────────────────────────────    │
│                                                            │
│  CASH RECONCILIATION                                       │
│  Opening float                           KES   5,000      │
│  Expected cash in till                   KES  19,200      │
│                                                            │
│  ACTUAL CASH COUNT                                         │
│  Enter physical cash counted:  KES [           ]          │
│                                                            │
│  ─────────────────────────────────────────────────────    │
│  [SUBMIT] → System calculates variance and logs report     │
└────────────────────────────────────────────────────────────┘
```

---

## 5. Interaction Patterns

### 5.1 Barcode Scan Feedback

On successful scan:
- Product row briefly highlights in accent green (150ms)
- Soft chime sound (optional, configurable)
- Quantity increments if item already in cart (with brief count animation)

On scan failure (unknown barcode):
- Search field populates with scanned code
- Amber notification: "Barcode not found — search by name or add as new product"
- No loud error tone (avoids embarrassing cashier in front of customer)

### 5.2 Quantity Adjustment in Cart

- Tap quantity number → inline edit field appears (numeric input)
- Physical keyboard or on-screen numpad
- Press Enter or tap outside → confirms
- Minus button: decrement; if quantity reaches 0 → confirmation before removing

### 5.3 Discount Application

- Cashier taps [DISCOUNT] → modal appears
  - Type: Percentage | Fixed amount
  - Applies to: Whole cart | Selected item
  - Reason field (required for audit log)
  - If discount % > manager threshold: "Manager approval required"
  - Manager enters PIN → discount applied → logged in audit trail

### 5.4 Long-Press / Right-Click Context Menus

On a cart item: [Change Quantity] [Apply Discount] [Remove Item]  
On a product in inventory: [Edit] [View History] [Print Label] [Write Off]  
On a customer: [Start Sale] [View Account] [Send Statement] [Record Payment]

### 5.5 Keyboard Shortcuts (Desktop)

| Shortcut | Action |
|---|---|
| `/` | Focus product search |
| `F2` | Open payment method selector |
| `F4` | Void last sale (with manager override) |
| `F5` | Open customer search |
| `F9` | Park/hold current cart |
| `Esc` | Close modal / cancel |
| `Enter` | Confirm default action in modal |

### 5.6 Confirmation Dialogs

Only for destructive actions (void, delete, stock write-off).  
Pattern: Red header, explicit consequence statement, "Cancel" (left) + "[Action]" (right — red button).  
Never use generic "Are you sure?". Always say exactly what will happen.

```
┌──────────────────────────────────────────┐
│  🔴  Void Sale #1056?                    │
│                                          │
│  This will:                              │
│  • Reverse KES 842 from today's total   │
│  • Return 3 items to inventory           │
│  • Cannot be undone                      │
│                                          │
│  Reason (required):                      │
│  [                                    ]  │
│                                          │
│  [Cancel]              [Void Sale]       │
│                         (red button)     │
└──────────────────────────────────────────┘
```

---

## 6. Offline UX

### 6.1 Connectivity Status Indicator

Always visible in the header — never hidden.

```
🟢 Online          ← green dot, no text (normal state)
🟡 Syncing (12)    ← amber, count of pending transactions syncing
🔴 Offline         ← red dot + "Offline" text
🔴 M-Pesa unavailable (offline)   ← shown in payment selector only when relevant
```

### 6.2 Offline Mode Banner

When offline, a persistent non-dismissible banner appears below the header:

```
┌──────────────────────────────────────────────────────────────┐
│  🔴  Offline mode — Cash sales only. M-Pesa unavailable.    │
│      Transactions will sync automatically when connected.    │
└──────────────────────────────────────────────────────────────┘
```

Colour: warm amber background (#FFF3CD), dark text — not alarming, clearly informational.

### 6.3 M-Pesa in Offline Mode

- M-Pesa button is visually disabled (greyed out) in the payment selector
- On tap: tooltip "M-Pesa requires internet connection. Accept cash or record as credit."
- No error sound; no jarring modal — just a calm explanation

### 6.4 eTIMS Pending Indicator on Receipt

Receipts generated while offline print with a clear marker:

```
─────────────────────────────
KRA eTIMS: PENDING SUBMISSION
Ref: LOCAL-2026-05-10-0042
This receipt will be updated
when connection is restored.
─────────────────────────────
```

### 6.5 Sync Notification

When internet restores and sync completes:

```
╔═══════════════════════════════════════╗
║  ✅  Synced 8 offline transactions    ║
║  eTIMS codes submitted. All OK.       ║
╚═══════════════════════════════════════╝
```

Toast notification — 4 seconds, then auto-dismiss. No action required.

---

## 7. M-Pesa Payment UX

### 7.1 Phone Number Entry

```
Phone number for M-Pesa:
┌────────────────────────────────────────┐
│  🇰🇪 +254  [712 345 678             ] │
└────────────────────────────────────────┘
```

- Auto-formats: strips leading 0 and adds +254; accepts 07XX or 01XX Kenyan numbers
- Validation: must be 12 digits total after formatting
- If customer account linked → pre-populated from CRM record (cashier can override)
- Numpad shown by default on touch devices

### 7.2 Amount Confirmation

- Amount pre-filled from cart total — cashier should not need to type this
- If split payment: show how much is being paid via M-Pesa vs cash

### 7.3 Payment States

| State | Visual | Duration |
|---|---|---|
| Sending request | Spinner on button | 0–3s |
| Waiting for PIN | Countdown ring (60s), pulsing | 0–60s |
| Confirmed | Green checkmark, confetti burst (subtle) | 2s → auto-advance |
| Cancelled by customer | Amber state; retry or switch method | Until action |
| Timeout | Red state; clear retry + cash fallback options | Until action |
| Network error | Amber; "Connection issue — try again" | Until action |

### 7.4 Handling Fake M-Pesa Confirmations

The system never asks the cashier to verify an SMS. Only the Daraja webhook confirmation advances the sale. This is a security feature communicated in onboarding:

> "The POS only completes an M-Pesa sale when Safaricom confirms the payment — not when you see an SMS. If a customer shows you an M-Pesa SMS, wait for the green confirmation on screen."

---

## 8. Receipt & Print UX

### 8.1 Receipt Preview (Before Print)

After a sale is complete, show a 1-second preview:

```
┌─────────────────────────┐
│   DUKA LA VITABU        │
│   Nakuru CBD, Kenya     │
│   Tel: 0712 345 678     │
│   KRA PIN: P051234567M  │
│ ─────────────────────── │
│ 10/05/2026   10:34      │
│ Receipt: #001056        │
│ Cashier: Brian          │
│ ─────────────────────── │
│ Form 3 Biology    x1    │
│           KES 650.00    │
│ Exercise Book 96pg x3   │
│            KES 135.00   │
│ Bic Biro Blue     x2    │
│             KES 50.00   │
│ ─────────────────────── │
│ Subtotal  KES   835.00  │
│ VAT 16%   KES     7.00  │
│ TOTAL     KES   842.00  │
│ ─────────────────────── │
│ CASH      KES 1,000.00  │
│ CHANGE    KES   158.00  │
│ ─────────────────────── │
│ KRA CU: VSCU-001        │
│ INV: KRA-2026-001056    │
│ [QR CODE]               │
│ ─────────────────────── │
│ Asante kwa kununua!     │
│ Thank you!              │
└─────────────────────────┘
```

### 8.2 Print Failure Handling

If printer is offline or out of paper:

```
⚠️  Printer not responding

Options:
[Try Again]     [Send via SMS]     [Send via WhatsApp]     [Close]
```

SMS/WhatsApp receipt options available as fallback — cashier enters customer number if not already recorded.

### 8.3 Reprint

Cashier can reprint any receipt from the sales history. Reprints stamped "DUPLICATE" on the printed copy (not on the original).

---

## 9. Mobile & Responsive Behaviour

### 9.1 Breakpoints

| Breakpoint | Width | Target device |
|---|---|---|
| Mobile | < 480px | Owner's smartphone (reporting only) |
| Tablet | 480–1024px | Android tablet POS terminal |
| Desktop | > 1024px | All-in-one POS terminal, PC |

### 9.2 Mobile Dashboard (Owner's Phone)

Owner dashboard is the only view optimised for sub-480px. It is read-only (no sales processing on phone).  
Stack layout: metric cards → alerts → quick links → recent sales.  
Bottom navigation: Dashboard | Reports | Alerts | Settings.

### 9.3 Tablet Checkout Layout

On tablet (480–1024px), checkout uses single-column layout:
- Top: product search + recent/category quick-add
- Middle: scrollable cart
- Bottom: sticky payment button bar

Optimised for portrait orientation with thumbable bottom controls.

### 9.4 Touch Optimisation

- All tap targets: minimum 48px height
- Cart item swipe-left to reveal [Remove] action
- Pull-to-refresh on reports and inventory screens
- No hover-only interactions — all features accessible on touch

---

## 10. Localisation (English / Swahili)

### 10.1 Language Strategy

- System default: English
- Per-user language preference stored in profile
- Cashier-facing labels: bilingual (English / Swahili) for key actions
- Owner-facing reports: English primary (financial terminology)
- Error messages and alerts: selected language only

### 10.2 Key Bilingual UI Strings

| English | Swahili |
|---|---|
| Cart | Kikapu |
| Total | Jumla |
| Cash | Pesa Taslimu |
| Change | Chenji |
| Payment | Malipo |
| Receipt | Risiti |
| Product not found | Bidhaa haipatikani |
| Payment confirmed | Malipo yamethibitishwa |
| Low stock | Bidhaa imepungua |
| Thank you | Asante |
| Add to cart | Ongeza kikapuni |
| Complete sale | Maliza mauzo |
| Void | Futa |

### 10.3 Currency Formatting

```typescript
// Always use KES, never $
// Thousands separator: comma
// Decimal separator: period
// No decimals for amounts > 100 in most UI contexts (receipts show 2dp)

formatKES(1234.5)   // → "KES 1,234.50"
formatKES(842)      // → "KES 842"
formatKES(0)        // → "KES 0"
```

### 10.4 Date & Time

- Date format: DD/MM/YYYY (Kenyan convention)
- Time: 24-hour or 12-hour per user preference; default 12h
- Timezone: Africa/Nairobi (EAT, UTC+3) — set server-side; no user config required

---

## 11. Accessibility

### 11.1 Standards Target

WCAG 2.1 Level AA compliance for all user-facing screens.

### 11.2 Colour Contrast

- All text on white backgrounds: minimum 4.5:1 ratio (AA)
- Large text (18px+): minimum 3:1 ratio
- Status colours (green/amber/red) never used as the only indicator — always paired with text or icon

### 11.3 Keyboard Navigation

- Full keyboard operability for desktop POS
- Tab order matches visual reading order
- All modals trap focus until dismissed
- `Esc` always closes modals

### 11.4 Screen Reader

- All interactive elements have accessible labels (aria-label where label not visible)
- Status updates (sync status, payment confirmation) announced via `aria-live`
- Receipt preview region labelled for screen reader traversal

### 11.5 Reduced Motion

Respect `prefers-reduced-motion`: disable confetti, pulse animations, and transition effects. Retain functional state changes (colour, text).

---

## 12. Error States & Empty States

### 12.1 Error State Principles

- Always explain what happened (not just "Error")
- Always offer a next step
- Never show a raw error code to the user (log internally, show friendly message)
- Network errors: distinguish "check your connection" from "our server is down"

### 12.2 Common Error States

**M-Pesa STK failed:**
```
Payment request failed
Safaricom returned: "Request cancelled by user"

[Try M-Pesa Again]     [Accept Cash Instead]
```

**eTIMS submission failed:**
```
⚠️ KRA receipt pending
Your sale is saved. We'll submit the tax 
invoice to KRA automatically when the 
connection is restored.
Sale ID: #001056
```
(Not shown to customer — internal log only)

**Printer not found:**
```
Printer not detected
Make sure the printer is:
• Powered on
• Connected via USB or Bluetooth
• Has paper loaded

[Try Again]     [Send Receipt by SMS]
```

**Product out of stock:**
```
🔴 No stock available
Form 2 Kiswahili has 0 units in stock.

[Override — proceed anyway]  (manager only)
[Remove from cart]
```

### 12.3 Empty States

Each empty state includes: illustration (simple SVG), explanation, primary action.

| Screen | Empty State Text | Action |
|---|---|---|
| Inventory | "No products yet. Add your first product to get started." | [Add Product] |
| Customers | "No customers saved. Add a customer to track credit and loyalty." | [Add Customer] |
| Reports — today | "No sales recorded today yet. Sales will appear here as you process them." | — |
| Low stock alerts | "✓ All stock levels are healthy. No alerts at the moment." | — |
| Credit outstanding | "✓ No outstanding credit balances. All accounts are settled." | — |

---

## 13. Onboarding Flow

### 13.1 First-Time Setup Wizard

Step-by-step, 6 screens, skippable after Step 3.

```
Step 1: Shop Details
  • Shop name, address, phone
  • KRA PIN
  • Owner name and phone

Step 2: M-Pesa Configuration
  • Till Number or Paybill Number
  • Daraja API credentials
  • Test STK Push (send KES 1 to owner's phone to confirm)

Step 3: Add First Products
  • Guided "Add Product" flow with ISBN scanner shortcut
  • Pre-loaded common Kenyan bookshop categories
  • CSV import option for existing stock lists

Step 4: Create Staff Logins
  • Add cashier: name, phone, PIN (4-digit)
  • Role assignment: Cashier, Stock Clerk, etc.

Step 5: Hardware Setup
  • Printer detection wizard (plug in, print test page)
  • Barcode scanner test (scan any item)
  • Cash drawer test (trigger open)

Step 6: Ready
  • Summary of what's configured
  • Link to WhatsApp support group
  • "Start Selling" → opens checkout screen
```

### 13.2 Contextual Tooltips (First Week)

During the first 7 days:
- Context-sensitive tooltips on key actions (first sale, first credit customer, first reconciliation)
- Dismissible; don't repeat after dismissal
- Available in both English and Swahili

### 13.3 Support Access

- Persistent "?" help button in bottom corner of every screen
- Opens WhatsApp to support number (not a chatbot — real support)
- In-app tutorial videos (short, 60–90 seconds each) in Swahili

---

## 14. Hardware Integration UX

### 14.1 USB Barcode Scanner

No configuration required. Scanner acts as keyboard input. The POS checkout screen auto-focuses the search field so scanned input is captured.

**Visual confirmation of scan:** The search field briefly flashes green and the added product row highlights. No separate notification needed.

### 14.2 Thermal Printer

**Printer status widget** in the sidebar/settings:

```
🖨️  Thermal Printer
• Status: Connected (USB)
• Model: Epson TM-T20III
• Paper: OK
[Test Print]     [Configure]
```

If printer status cannot be detected (browser limitation on some OS): show "Print when ready — click to open print dialog".

### 14.3 Cash Drawer

Cash drawer opens automatically on every cash sale completion. If the drawer is already open when the next sale starts, a subtle indicator is shown: "⚠️ Cash drawer open".

Manual open: Settings → Cash Drawer → [Open Drawer] (for counting float, etc.)

### 14.4 Android Bluetooth Printer Pairing

First-time setup flow:

```
Step 1: Power on Bluetooth printer
Step 2: [Scan for Printers] → list of nearby Bluetooth devices
Step 3: Tap printer name → pairing request
Step 4: [Print Test Page] → confirm it prints correctly
Step 5: Printer saved for this device ✓
```

---

## 15. Component Library Reference

### 15.1 Core Components

```typescript
// Primary Button
<Button variant="primary" size="lg" loading={false} disabled={false}>
  Complete Sale
</Button>

// variants: primary | secondary | danger | ghost
// sizes: sm | md | lg | xl (xl = checkout CTA)

// Amount Display (large, for cashier use)
<AmountDisplay amount={842} currency="KES" size="hero" />
// sizes: sm (tables) | md (summaries) | lg (totals) | hero (cash screen)

// Status Badge
<StatusBadge status="low-stock" />   // amber
<StatusBadge status="out-of-stock" /> // red
<StatusBadge status="confirmed" />    // green
<StatusBadge status="pending" />      // blue

// Product Search Field
<ProductSearch
  onProductFound={(product) => addToCart(product)}
  onBarcodeNotFound={(code) => openAddProductModal(code)}
  placeholder="Scan barcode or search product name..."
/>

// Offline Banner
<OfflineBanner visible={!isOnline} pendingCount={syncStore.pendingCount} />

// Receipt Preview
<ReceiptPreview sale={sale} etims={etimsResult} />

// M-Pesa Timer
<MpesaCountdown 
  seconds={60} 
  onTimeout={handleTimeout}
  onConfirmed={handleConfirmed}
  phone="0712345678"
  amount={842}
/>

// Confirmation Dialog
<ConfirmationDialog
  title="Void Sale #1056?"
  consequences={['Reverses KES 842 from today\'s total', 'Returns 3 items to inventory']}
  requireReason={true}
  confirmLabel="Void Sale"
  variant="danger"
  onConfirm={handleVoid}
/>
```

### 15.2 Layout Components

```typescript
// Page layout with sidebar nav
<AppLayout role={user.role}>
  <PageContent title="Inventory" actions={<Button>Add Product</Button>}>
    {/* content */}
  </PageContent>
</AppLayout>

// Data table with sort, filter, pagination
<DataTable
  columns={columns}
  data={products}
  loading={isLoading}
  emptyState={<EmptyState ... />}
  pagination={{ page, pageSize, total }}
/>

// Metric card (dashboard)
<MetricCard
  label="Today's Revenue"
  value={formatKES(24850)}
  trend={+12}         // percentage change vs yesterday
  trendLabel="vs yesterday"
/>
```

---

*End of UX Specification*

---

> **Document Owner:** Design Team  
> **Review Cycle:** Each sprint / major feature  
> **Related Docs:** PRD.md, TECH_SPEC.md  
> **Figma:** [Link to design file — TBD]

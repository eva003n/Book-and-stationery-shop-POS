# UX Specification
## Duka POS — Point of Sale System for Book & Stationery Retail (Kenya)

**Version:** 1.0.0  
**Date:** 2026-04-30  
**Status:** Draft for Review  
**Owner:** Design / Product Team

---

## Table of Contents

1. [UX Principles](#1-ux-principles)
2. [User Flows](#2-user-flows)
3. [Screen Specifications](#3-screen-specifications)
4. [Interaction Patterns](#4-interaction-patterns)
5. [Error States & Edge Cases](#5-error-states--edge-cases)
6. [Accessibility](#6-accessibility)
7. [Localisation](#7-localisation)
8. [Onboarding & Help](#8-onboarding--help)

---

## 1. UX Principles

### 1.1 Speed Over Features
The POS screen is used under pressure — a queue forms in seconds. Every interaction must default to the fastest path. No confirmation dialogs on non-destructive actions. No loading spinners on operations that take < 300ms.

### 1.2 Fail Safely
When something goes wrong (M-Pesa timeout, printer offline, no internet), the system tells the cashier exactly what happened in plain language and what to do next. It never leaves a cashier stuck with a customer waiting and no guidance.

### 1.3 No Training Required for Basic Tasks
A cashier who has never seen the system before should be able to process a cash sale and print a receipt within 5 minutes of first use. The POS primary flow has no hidden steps.

### 1.4 Designed for the Environment
- Cheap Android tablets with unresponsive touchscreens → large tap targets, no swipe-only gestures
- Shop fluorescent lighting → high-contrast palette, avoid pure white backgrounds
- Noisy environment → visual feedback for every action, not audio-only
- Shared device (multiple cashiers per till) → fast PIN login, visible current user

### 1.5 Swahili-Friendly
All user-facing copy must be available in English and Kiswahili. Kiswahili should be the default for cashier-facing screens. English default for manager/admin screens.

---

## 2. User Flows

### 2.1 Standard Sale Flow (Happy Path)

```
[Cashier logs in with PIN]
         │
         ▼
[POS Home Screen]
  — Active shift shown
  — Cart is empty
         │
         ▼
[Add items to cart]
  — Scan barcode / type / tap product
  — Each item added shows with name, qty, price
  — Running total updates instantly
         │
         ▼
[Review cart]
  — Optionally adjust quantities
  — Optionally apply discount (≤10% no PIN, >10% needs manager PIN)
         │
         ▼
[Select payment method]
  — [CASH] / [M-PESA] / [SPLIT]
         │
    ┌────┴─────┐
    │          │
  CASH       M-PESA
    │          │
    ▼          ▼
[Enter cash  [Enter customer
 tendered]    phone number]
    │          │
    ▼          ▼
[Change      [STK Push sent]
 calculated] [Waiting for PIN]
    │          │
    │          ▼
    │        [Confirmed ✓]
    └────┬────┘
         │
         ▼
[Transaction complete]
  — Show success screen (2 sec)
  — Option: Print / SMS / Email receipt
  — Auto-return to empty cart
```

### 2.2 Barcode / ISBN Scan Flow

```
[Camera / USB scanner activated]
         │
         ▼
[Barcode detected]
         │
    ┌────┴──────────┐
    │               │
  Found          Not found
    │               │
    ▼               ▼
[Add to cart]   [Show: "Product not found"]
                [Search bar pre-filled with barcode]
                [Option: Add new product]
```

### 2.3 M-Pesa STK Push Flow (Detail)

```
[Cashier taps M-PESA]
         │
         ▼
[Phone number entry screen]
  — Number pad + field
  — Validates 07XX / 01XX / 254XX format
  — "Confirm" button
         │
         ▼
[STK Push sent]
  — Animated spinner
  — Message: "Sending payment request to 0722 XXX XXX..."
         │
         ▼
[Waiting for customer PIN]
  — Green pulsing animation
  — Timer counts down from 90 seconds
  — Message: "Waiting for customer to enter M-Pesa PIN..."
  — [Cancel] button visible
         │
    ┌────┴──────────┐
    │               │
 Confirmed       Failed / Timeout
    │               │
    ▼               ▼
[✓ M-Pesa        [Error screen]
 Received]       Options:
[Ref: QHJ123]    — Retry STK Push
                 — Switch to Cash
                 — Enter M-Pesa ref manually (manager PIN)
```

### 2.4 Void / Refund Flow

```
[Manager opens transaction history]
         │
         ▼
[Search by transaction no. / date / cashier]
         │
         ▼
[View transaction detail]
         │
         ▼
[Tap VOID TRANSACTION]
         │
         ▼
[Confirmation dialog]
  "Are you sure you want to void TXN-20260430-00042?
   This cannot be undone."
  [Confirm] [Cancel]
         │
         ▼
[Enter manager PIN]
         │
         ▼
[Select void reason]
  — Customer changed mind
  — Wrong item scanned
  — Payment error
  — Other (free text)
         │
         ▼
[Void recorded + audit logged]
[Print void receipt]
```

### 2.5 End of Day / Z-Report Flow

```
[Manager taps END OF DAY]
         │
         ▼
[Count cash in till]
  — Numpad to enter denominations
  — System shows: Expected vs Actual
  — Variance displayed (over / short)
         │
         ▼
[Review Z-Report summary]
  — Cash sales total
  — M-Pesa sales total
  — Total transactions
  — Total discounts
  — Total VAT collected
  — Net revenue
         │
         ▼
[Confirm close]
  — [Print Z-Report] 
  — [Email Z-Report]
  — [Close Shift]
```

### 2.6 Stock Receive (GRN) Flow

```
[Stock Controller taps RECEIVE STOCK]
         │
         ▼
[Enter GRN details]
  — Supplier (dropdown)
  — Delivery note / invoice number
  — Date received
         │
         ▼
[Add items received]
  — Scan barcode or search
  — Enter quantity received
  — Enter unit cost (optional — updates buying price)
  — Add more lines
         │
         ▼
[Review GRN]
  — Line items + totals
  — [Confirm Receipt]
         │
         ▼
[Stock levels updated]
[GRN saved + printable]
```

---

## 3. Screen Specifications

### 3.1 Login Screen

**Purpose:** Fast authentication. Supports PIN or password.

**Elements:**
- Shop logo / name (top centre)
- User selector: avatar grid showing currently active users (tap to select)
- 6-button PIN pad (large, 72px × 72px keys)
- PIN dot indicators (hidden input)
- "Switch User" link

**Behaviour:**
- Auto-focus PIN after user selection
- Incorrect PIN: shake animation + "Incorrect PIN" below dots
- 5 failed attempts: lock for 5 minutes + notify manager

**Responsive:** Full-screen on tablet. 320px min-width support.

---

### 3.2 POS Home Screen

**Purpose:** The primary transaction screen. Cashier spends 90% of their time here.

**Layout (Tablet Landscape, 1024×768):**

```
┌─────────────────────────────────────────────────────────────┐
│ [≡] Duka Books  |  Cashier: Amina  |  09:42  |  ● Online   │
├───────────────────────────────┬─────────────────────────────┤
│ [🔍 Scan or search...]         │ CART                       │
├──────────┬───────────────────-┤ ─────────────────────────   │
│ Books    │ Stationery │ Art   │ Oxford Dictionary    KES 850│
├──────────┴────────────────────┤ Ballpoint Pen x3     KES 90 │
│ ┌───────────┐ ┌───────────┐   │ Exercise Book A4     KES 65 │
│ │ [cover]   │ │ [cover]   │   │                             │
│ │ Title...  │ │ Title...  │   │                             │
│ │ KES 850   │ │ KES 450   │   │ ─────────────────────────   │
│ └───────────┘ └───────────┘   │ Subtotal:        KES 1,005  │
│                               │ Discount:           KES -50 │
│                               │ VAT (16%):          KES 134 │
│                               │                             │
│                               │ TOTAL:           KES 1,089  │
│                               │                             │
│                               ├─────────────────────────────┤
│                               │ [CASH]  [M-PESA]  [SPLIT]  │
└───────────────────────────────┴─────────────────────────────┘
```

**Key Interactions:**
- Tapping a product card adds 1 unit to cart with a satisfying spring animation
- Long-press on a cart item opens edit (qty, discount, remove)
- The TOTAL amount uses 36px bold font — unmissable
- Payment buttons are 64px tall, full-width across the cart panel footer

**Tablet Portrait (768×1024):** Cart collapses to a bottom drawer; product grid takes full width.

**Phone (360×800):** Two-column product grid; cart is a persistent floating bar at bottom showing total + "Pay" button.

---

### 3.3 Payment — Cash Screen

**Elements:**
- TOTAL amount (large, top)
- "Amount tendered" label + display field
- Numpad (large keys, includes decimal and delete)
- CHANGE DUE (large green if positive, red if insufficient)
- [COMPLETE SALE] button (green, full-width, 64px, disabled until tendered ≥ total)
- [BACK] button

**Behaviour:**
- Preset "Exact" button fills tendered = total
- Common denomination shortcuts: [100] [200] [500] [1000] [2000]
- Change animates into view (slide-up) when calculation is ready
- Pressing COMPLETE SALE triggers receipt prompt

---

### 3.4 Payment — M-Pesa Screen

**States:**

**State 1 — Phone Entry:**
```
┌─────────────────────────┐
│   M-Pesa Payment        │
│   KES 1,089             │
│                         │
│   Customer phone:       │
│   ┌───────────────────┐ │
│   │ 0722              │ │
│   └───────────────────┘ │
│                         │
│  [0][7][2][2][...]      │
│  (numpad)               │
│                         │
│  [SEND REQUEST]         │
└─────────────────────────┘
```

**State 2 — Waiting:**
```
┌─────────────────────────┐
│   ⏳ Waiting...          │
│                         │
│   Request sent to       │
│   0722 XXX XXX          │
│                         │
│   Ask customer to       │
│   check their phone     │
│   and enter PIN         │
│                         │
│   ████████░░  72s       │
│                         │
│   [Cancel]              │
└─────────────────────────┘
```

**State 3 — Confirmed:**
```
┌─────────────────────────┐
│   ✅ M-Pesa Received     │
│                         │
│   KES 1,089             │
│   Ref: QHJ4X89P        │
│   0722 XXX XXX          │
│                         │
│   [COMPLETE SALE]       │
└─────────────────────────┘
```

**State 4 — Failed:**
```
┌─────────────────────────┐
│   ❌ Payment Failed      │
│                         │
│   Customer cancelled    │
│   or request timed out. │
│                         │
│   [Try Again]           │
│   [Switch to Cash]      │
│   [Enter Ref Manually]  │
└─────────────────────────┘
```

---

### 3.5 Receipt Screen

**Elements:**
- "Payment Complete ✓" header (green, large)
- Transaction number
- Three receipt options as prominent buttons:
  - 🖨️ **Print Receipt** (default action, auto-triggered if printer connected)
  - 📱 **Send to Phone** (SMS — enter/confirm number)
  - 📧 **Send by Email** (optional)
  - ⏭️ **Skip** (small, below buttons)
- Countdown timer (3 sec) to auto-advance to next sale

---

### 3.6 Manager Dashboard

**Layout:**
- Top KPI cards: Today's Revenue | Transactions | Cash | M-Pesa
- Line chart: Hourly revenue today vs yesterday
- Top 5 Products table (name, units sold, revenue)
- Recent Transactions list (last 10, with void button)
- Low Stock Alerts panel (items at/below reorder level)

**Data refresh:** Real-time via WebSocket for KPIs; 5-minute polling for charts.

---

### 3.7 Product Catalogue Screen

**Layout:**
- Search bar (top)
- Filter bar: Category | In Stock Only | Sort
- Product table: image thumbnail | name | SKU | barcode | price | stock | actions
- [Add Product] FAB button (bottom right)

**Product Form:**
- Tabs: Details | Pricing & VAT | Stock | Images
- Barcode field has "Scan" button to use camera
- ISBN field auto-fetches book metadata (title, author, publisher) from Open Library API if available

---

### 3.8 Stock Adjustment Screen

**Elements:**
- Product search (required)
- Current stock level (read-only)
- Adjustment type: [Add] [Remove] [Set to]
- Quantity field (numpad)
- Reason (required dropdown): Damage | Theft | Count Correction | Other
- Notes (optional free text)
- [Save Adjustment] button

**Validation:**
- Cannot reduce stock below zero without explicit "Yes, this is correct" confirmation
- Reason is mandatory — form does not submit without it

---

## 4. Interaction Patterns

### 4.1 Adding Items to Cart

- **Barcode scan:** Item is added immediately with an animation (card "flies" into cart). No confirmation needed.
- **Search result tap:** Same as scan — immediate add.
- **Product card long-press (500ms):** Opens a mini-sheet with: Quantity input, View details, Add to cart.
- **Duplicate item:** Increments quantity rather than adding a new line. The existing cart row briefly highlights.

### 4.2 Quantity Editing in Cart

- Tap the quantity number → inline numpad appears below the cart item
- [+] and [-] buttons for quick ±1
- Tap quantity → numpad appears
- Swipe left on cart item → reveals [Remove] button (red)

### 4.3 Numpad Behaviour

The shared Numpad component follows these rules:

- Always shows digits 0–9, backspace, decimal (if needed), and a confirm/done key
- Backspace clears one digit at a time; long-press backspace clears all
- Decimal only enabled on fields that accept fractions (weight, price) — disabled for quantity
- Max value enforced silently (replaces with max if exceeded)
- Haptic feedback on each key tap (if device supports it)

### 4.4 Notifications & Toasts

| Event | Toast Type | Duration | Position |
|---|---|---|---|
| Item added to cart | None (animation is feedback) | — | — |
| Transaction complete | Success (green) | 2s | Top-centre |
| Printer error | Error (red) | persistent | Top-centre |
| Low stock warning | Warning (amber) | 5s | Bottom-right |
| M-Pesa confirmed | Success (green) | 3s | Full-screen overlay |
| Sync error | Warning (amber) | persistent | Top bar |
| Connectivity lost | Info (blue) | persistent | Top bar |

### 4.5 Loading States

- **< 300ms:** No loading indicator (action feels instant)
- **300ms – 1s:** Skeleton loader or spinner on the specific element
- **> 1s:** Full loading state with cancel option where applicable
- **M-Pesa waiting:** Progress bar with countdown timer (unique pattern, not generic spinner)

---

## 5. Error States & Edge Cases

### 5.1 POS-Specific Error Catalogue

| Scenario | User Message (English) | User Message (Kiswahili) | Recovery Action |
|---|---|---|---|
| Product not found | "Product not found. Check the barcode or search by name." | "Bidhaa haijapatikana. Angalia nambari ya msimbo au tafuta kwa jina." | Search field pre-filled |
| M-Pesa STK push failed to send | "Could not send M-Pesa request. Check the phone number and try again." | "Ombi la M-Pesa halikuweza kutumwa. Angalia nambari ya simu na jaribu tena." | Retry / Switch to Cash |
| M-Pesa timeout (90s) | "No response from customer. Payment cancelled." | "Mteja hakujibu. Malipo yameghairiwa." | Retry / Switch to Cash / Manual ref |
| M-Pesa failed (customer cancelled) | "Customer cancelled the payment." | "Mteja alighairi malipo." | Retry / Switch to Cash |
| Printer offline | "Printer not connected. Sale saved — receipt can be reprinted later." | "Printer haijaunganishwa. Mauzo yamehifadhiwa — risiti inaweza kuchapishwa baadaye." | Continue / Retry print |
| No internet (M-Pesa attempt) | "No internet connection. M-Pesa is unavailable. Please accept cash." | "Hakuna muunganisho wa intaneti. M-Pesa haipatikani. Tafadhali pokea pesa taslimu." | Switch to Cash only |
| Insufficient stock | "Only X units available." | "Ni vitengo X tu vilivyopo." | Edit quantity |
| Session expired | "Your session has ended. Please enter PIN to continue." | "Kikao chako kimeisha. Tafadhali ingiza PIN kuendelea." | PIN re-entry |
| eTIMS submission failure | "Tax receipt generation pending. Sale recorded — will retry automatically." | "Risiti ya kodi inasubiri. Mauzo yamerekodiwa — itajaribu tena kiotomatiki." | No cashier action needed |
| Cash tendered < total | [COMPLETE SALE button stays disabled] — no error toast, the UI state communicates it | — | Enter correct amount |

### 5.2 Offline Mode Behaviour

**What works offline:**
- Adding items to cart (from local cache)
- Processing cash sales
- Printing receipts (if printer is USB/Bluetooth)
- Viewing current stock levels (cached)
- Viewing today's transactions

**What doesn't work offline:**
- M-Pesa (requires internet — button grayed with explanation)
- eTIMS receipt transmission (queued, auto-submits on reconnect)
- Real-time manager dashboard
- Product catalogue sync

**Offline indicator:** A persistent amber banner at the top: "⚠️ Offline — Cash only. Transactions will sync when connection is restored."

### 5.3 Concurrent Till Conflict

If two cashiers both sell the last unit of an item simultaneously:

- Server detects oversell on sync
- System marks the later transaction as needing a manual review
- Manager receives an alert: "Oversell detected on [Product Name]. Review required."
- Neither transaction is voided automatically — manager decides

---

## 6. Accessibility

### 6.1 Standards Target

WCAG 2.1 Level AA for all screens.

### 6.2 Colour Contrast

- Normal text: minimum 4.5:1 contrast ratio
- Large text (≥18pt or ≥14pt bold): minimum 3:1
- All interactive elements: minimum 3:1 against adjacent colours
- Error states: never rely on colour alone — always include icon + text

### 6.3 Touch & Motor

- All interactive elements: minimum 48×48px touch target
- Primary actions (payment buttons): 64px height
- No time-limited interactions except M-Pesa (which has an explicit timer UI)
- No gestures as the only way to trigger actions — all swipe actions have a tap alternative

### 6.4 Screen Readers

- All icons have `aria-label`
- Cart total is in a `role="status"` live region (updates announced)
- M-Pesa status changes are in a `role="alert"` live region
- Form fields have associated `<label>` elements
- Error messages are associated with their inputs via `aria-describedby`

### 6.5 Font Size

- Minimum body text: 16px (1rem)
- System font-size scaling respected — no `user-scalable=no` in viewport meta

---

## 7. Localisation

### 7.1 Supported Languages

- **English (en-KE)** — default for manager/admin
- **Kiswahili (sw-KE)** — default for cashier/POS

### 7.2 Currency Formatting

```
KES 1,089.00   → correct
KES1089        → incorrect (no space, no thousands separator)
Ksh 1,089      → also acceptable (both KES and Ksh are used in Kenya)
```

Always display currency symbol before the amount. Use Intl.NumberFormat with `currency: 'KES'` and `currencyDisplay: 'symbol'`.

### 7.3 Date & Time

- Date format: DD/MM/YYYY (Kenyan standard)
- Time format: 24-hour (HH:mm) on receipts; 12-hour (h:mm AM/PM) in dashboard UX
- Time zone: Africa/Nairobi (EAT, UTC+3) — hardcoded, no user-selectable timezone

### 7.4 Phone Number Entry

- Accept: `07XX XXXXXX`, `01XX XXXXXX`, `+254XXXXXXXXX`, `254XXXXXXXXX`
- Normalise internally to `254XXXXXXXXX` before Daraja API calls
- Display as `0722 XXX XXX` in UI for readability

### 7.5 String Externalisation

All user-facing strings in `/locales/en.json` and `/locales/sw.json`. No hardcoded strings in components.

---

## 8. Onboarding & Help

### 8.1 First-Time Setup Wizard (Admin)

Shown once, on first login as admin:

1. **Business details** — name, KRA PIN, address, logo upload
2. **M-Pesa setup** — Paybill / Till number, Daraja credentials (with link to how to get them)
3. **eTIMS setup** — API key, branch code
4. **Add first products** — CSV import or manual entry
5. **Create staff accounts** — add cashiers and managers
6. **Test transaction** — guided walkthrough of a KES 0 test sale

Each step is optional to skip (except business details). Steps can be revisited from Settings.

### 8.2 Cashier Onboarding Tour

Triggered on first login for the cashier role:

- Tooltip overlay: "This is your search bar — scan a barcode or type a product name"
- Tooltip: "Items you add appear here in your cart"
- Tooltip: "When ready, choose how the customer is paying"
- Final screen: "You're ready! Process your first sale."

Tour is skippable and can be re-triggered from Help menu.

### 8.3 Contextual Help

Every screen has a [?] button (top-right). Tapping it opens a slide-up panel with:

- A short description of what this screen does
- The top 3 most common actions
- A link to the full help article (opens in browser)

### 8.4 Help Content Topics

- How to process a sale
- How to handle M-Pesa issues
- How to do end-of-day cash-up
- How to add products
- How to receive stock
- How to run sales reports
- How to void a transaction
- What to do if the printer isn't working
- What to do if there's no internet

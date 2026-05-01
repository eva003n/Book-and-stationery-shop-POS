# Product Specification
## Duka POS — Point of Sale System for Book & Stationery Retail (Kenya)

**Version:** 1.0.0  
**Date:** 2026-04-30  
**Status:** Draft for Review  
**Owner:** Evan Ngugi

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Success Metrics](#3-goals--success-metrics)
4. [Users & Personas](#4-users--personas)
5. [Scope](#5-scope)
6. [Feature Requirements](#6-feature-requirements)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [Constraints & Assumptions](#8-constraints--assumptions)
9. [Risks](#9-risks)
10. [Glossary](#10-glossary)

---

## 1. Executive Summary

**Duka POS** is a production-grade point-of-sale system purpose-built for book and stationery retailers in Kenya. It handles the full retail loop — inventory management, sales transactions, M-Pesa, cash, credit/debit card payments, receipt generation, customer relationdhip management, and business reporting — in a fast, offline-capable interface that works on a desktop, a tablet, or a cheap Android device.

The system is designed for the realities of Kenyan retail: intermittent internet, M-Pesa as the dominant payment rail, KRA eTIMS compliance for tax invoices, and mixed-SKU inventory that spans thousands of book titles, pens, exercise books, art supplies, and school kits.

---

## 2. Problem Statement

### Current State

Most small-to-medium book and stationery shops in Kenya use one of the following:

- Manual paper records or exercise-book ledgers

- Generic POS software  not tailored to local payment or tax requirements(as of 2027)

- Poor Inventory Management for High SKU Counts: Many systems struggle to handle thousands of unique ISBNs and stationery items simultaneously, leading to stock inaccuracies, overstocking, or missed reorder points.

- Slow Transactions during Peak Hours: Older or low-capacity POS systems often lag or freeze when dealing with high-volume sales, resulting in long queues and customer frustration.

- No inventory system at all — reordering is done by gut feel

### Pain Points

| Pain Point | Impact |
|---|---|
| Manual stock takes are slow and error-prone | Stockouts and overstock of slow-moving titles |
| M-Pesa reconciliation is manual | Daily cash-up takes 30–60 min; errors common |
| No KRA eTIMS integration | Non-compliance risk; audit exposure |
| Multi-category inventory (books + stationery) needs different logic | Barcoding, ISBN lookup, and bulk stationery pricing differ |
| No real-time sales data | Owners can't see which products sell, when, or to whom |
| Paper receipts only | Cannot email or SMS receipts; no customer record |
| Slow transactions & long queues during high peak season | During back to school periods when parents and students flood bookshops
---

## 3. Goals & Success Metrics

### Primary Goals

1. Reduce transaction time at the till to under 30 seconds per sale
2. Automate M-Pesa reconciliation — zero manual tallying at end of day
3. Achieve KRA eTIMS compliance for all taxable transactions
4. Sales tracking - Give owners a real-time view of stock levels, sales velocity, and profit margins
5. Customer relationship features to enhance customer loyalty
### Secondary goals
1. ISBN lookup API integration (e.g. Open Library) for automatic book data fill
2. Multi-branch support
3. WhatsApp|email|sms receipt delivery
4. Supplier and purchase order management
5. Consignment book tracking

### Success Metrics

| Metric | Baseline | Target (6 months post-launch) |
|---|---|---|
| Average transaction time | ~3 min (manual) | < 30 sec |
| Daily cash-up time | 45 min | < 5 min |
| Stockout incidents per month | Untracked | ≤ 2 per category |
| KRA compliance | 0% | 100% |
| System uptime | N/A | 99.5% |
| Cashier training time | N/A | < 2 hours |

---

## 4. Users & Personas

### 4.1 Cashier (Primary User)

**Profile:** Age 18–30, secondary or college education, familiar with M-Pesa, may not be computer-literate beyond basic smartphone use.

**Goals:**
- Complete sales quickly with minimal clicks
- Look up items by barcode, ISBN, or product name
- Accept M-Pesa, credit/debit card, cash, or split payment without confusion
- Print or send receipts

**Pain points:**
- Slow or complex software causes queues
- Errors in change calculation under pressure
- Uncertainty about which items are in stock

### 4.2 Shop Owner / Manager

**Profile:** Business owner aged 30–55, manages 1–3 shops, reviews reports on mobile, may not be on-site daily.

**Goals:**
- Monitor daily sales and cash position remotely
- Know which products are running low
- Understand profit margins per category
- Manage staff access and accountability

**Pain points:**
- No visibility into what cashiers are doing
- Manual stock takes are disruptive
- Cannot easily compare performance across days or months

### 4.3 Stock Controller / Buyer

**Profile:** May be the owner or a dedicated staff member. Manages supplier orders, goods received, and pricing.

**Goals:**
- Know exactly what's in stock and what needs reordering
- Record goods received notes (GRN)
- Update prices and apply promotions
- Track supplier performance

### 4.4 Accountant (External / Occasional)

**Profile:** External bookkeeper or accountant. Accesses reports monthly for VAT returns and management accounts.

**Goals:**
- Export Z-reports, sales summaries, and VAT reports
- Reconcile M-Pesa statements with system records
- Verify KRA eTIMS compliance

---

## 5. Scope

### 5.1 In Scope — Version 1.0

- Point of Sale (POS) transaction screen
- Product catalogue with ISBN/barcode lookup
- Inventory management (stock levels, GRN, adjustments)
- M-Pesa STK Push integration, till/paybill (Daraja API) & credit/debit card payments
- Cash payment with change calculation
- KRA eTIMS fiscal receipt generation
- Customer display / receipt (print, SMS, email)
- End-of-day Z-report and cash-up
- Basic reporting (sales by day/week/month, top products, category breakdown)
- Multi-user with role-based access (cashi'er, manager, admin)
- Offline mode with sync on reconnection
- Advanced CRM / customer profiles
- 
### 5.2 Out of Scope — Version 1.0

- E-commerce / online storefront
- Loyalty points / rewards programme  (planned v1.3)
- Supplier portal
- Multi-branch stock transfers (planned v1.2)
- Integrated accounts payable / full accounting (refer to external accounting software)

---

## 6. Feature Requirements

### 6.1 POS Transaction Screen

**FR-001** The cashier shall be able to add items to a cart by scanning a barcode, typing an ISBN, or searching by product name.

**FR-002** The system shall display the running total inclusive of VAT in KES at all times.

**FR-003** The cashier shall be able to apply item-level discounts (percentage or fixed KES) with manager PIN confirmation for discounts > 10%.

**FR-004** The system shall support split payments across M-Pesa, credit/debit card and cash in a single transaction.

**FR-005** The system shall calculate change due for cash payments automatically and display it prominently.

**FR-006** On completing a payment the system shall print a receipt, optionally SMS it to a phone number, or optionally email it.

**FR-007** The cashier shall be able to void a transaction before payment is complete without manager override. Post-payment void requires manager PIN.

**FR-008** The system shall support a "hold" function allowing a transaction to be paused and resumed.

**FR-009** The system shall show real-time stock availability when an item is added to cart. A warning shall appear if stock is ≤ reorder point.

### 6.2 Payment Integration

**FR-010** The system shall initiate an STK Push to the customer's phone via Safaricom Daraja API on M-Pesa selection.

**FR-011** The system shall poll for M-Pesa confirmation and display a live status (Pending → Confirmed / Failed) without requiring cashier action.

**FR-012** On confirmed M-Pesa payment the system shall record the M-Pesa transaction reference, phone number, and timestamp.

**FR-013** The end-of-day Z-report shall auto-reconcile M-Pesa collections against the till total.

**FR-014** If M-Pesa confirmation is not received within 90 seconds the system shall allow manual override with manager PIN and reason code.

**FR-015** The system shall initiate a Korapay checkout session when the cashier selects card payment, generating a payment link or inline iframe that the customer completes on a card terminal or customer-facing screen.
**FR-016** The system shall poll for Korapay payment confirmation and display a live status (Pending → Confirmed / Failed) without requiring cashier action.
**FR-017** On confirmed card payment the system shall record the Korapay transaction reference, card type (Visa/Mastercard), last 4 digits if returned, and timestamp.
**FR-018** The end-of-day Z-report shall auto-reconcile card collections against the till total, broken out separately from M-Pesa and cash.
**FR-019** If Korapay confirmation is not received within 120 seconds the system shall allow manual override with manager PIN and reason code.

### 6.3 Product Catalogue & Inventory

**FR-020** Each product record shall store: SKU, name, category, sub-category, barcode (EAN-13 / ISBN-13), buying price, selling price, VAT rate, unit of measure, and reorder level.

**FR-021** The system shall support bulk import of products via CSV.

**FR-022** The stock controller shall be able to record a Goods Received Note (GRN) referencing a supplier and purchase order number, which automatically updates stock levels.

**FR-023** The system shall support manual stock adjustments with a mandatory reason (damage, theft, count correction) and an audit trail.

**FR-024** Inventory reports shall show current stock, stock value at cost and at selling price, and slow-moving items (no sale in X days, configurable).

**FR-025** The system shall generate a low-stock alert (in-app and optionally SMS) when any item falls to or below its reorder level.

### 6.4 KRA eTIMS Compliance

**FR-026** Every completed sale shall generate a compliant eTIMS fiscal receipt with: trader PIN, branch code, invoice number, item breakdown, VAT amount, and QR code.

**FR-027** The system shall transmit invoice data to the KRA eTIMS API in real time. If offline, receipts shall be queued and transmitted on reconnection.

**FR-028** The system shall support VAT-exempt, zero-rated, and standard-rated (16% VAT) items in a mixed cart.

**FR-029** A daily eTIMS submission report shall be available to the accountant role.

### 6.5 Reporting

**FR-030** The manager dashboard shall show: today's revenue, today's transactions, cash vs M-Pesa split, and top 5 products — updating in real time.

**FR-031** The system shall produce a Z-Report at end of day showing: opening float, cash sales, M-Pesa sales, refunds, discounts, gross revenue, VAT collected, and net revenue.

**FR-032** The system shall produce sales reports filterable by date range, category, cashier, and payment method.

**FR-033** Reports shall be exportable as PDF and CSV.

### 6.6 User Management & Security

**FR-034** The system shall support three roles: Cashier, Manager, and Admin.

**FR-035** Cashier actions shall be limited to: processing sales, printing receipts, and viewing their own shift summary.

**FR-036** Manager actions shall additionally include: voiding transactions, applying large discounts, viewing all reports, and unlocking the cash drawer.

**FR-037** Admin actions shall include: all of the above plus user management, pricing, system settings, and data export.

**FR-038** All actions shall be logged in an immutable audit trail with user ID, timestamp, and action details.

**FR-039** Sessions shall expire after 15 minutes of inactivity on the POS screen. Re-authentication shall be by PIN.

### 6.7 Offline Mode

**FR-040** The system shall operate fully (sales, receipts, inventory deductions) without an internet connection.

**FR-041** M-Pesa and card payments shall be unavailable offline. The system shall clearly communicate this and default to cash-only mode.

**FR-042** All offline transactions shall sync to the server automatically when connectivity is restored, with conflict detection.

**FR-043** The system shall display a visible connectivity indicator at all times.

### 6.8 Customer relationship features

**FR-044** The system shall allow cashiers to create a customer profile at point of sale by capturing name and phone number (minimum required fields).

**FR-045** The system shall support optional customer profile fields including email address, date of birth, and account type.

**FR-046** The system shall automatically associate a transaction with a customer profile when the customer is identified at checkout.

**FR-047** The system shall award loyalty points on every completed sale at a configurable rate (default: 1 point per KES 10 spent).
 The system shall display a customer's current loyalty points balance on the checkout screen when a customer is selected.

**FR-048** The system shall print or display the points earned and running balance on every receipt issued to a loyalty member.
FR-056 The system shall allow customers to redeem loyalty points against a purchase at a configurable redemption rate (default: 1 point = KES 1).

**FR-049** The system shall prevent loyalty point redemption from reducing the payable amount below KES 0.
FR-058 The system shall maintain a full per-customer transaction history searchable by date range, product, or receipt number.
FR-059 The system shall support credit accounts for approved customers, enforcing a configurable credit limit per customer.

**FR-050** The system shall prevent a credit purchase that would cause a customer's outstanding balance to exceed their approved credit limit.

**FR-051** The system shall display a customer's outstanding credit balance and available credit limit at checkout when a credit account exists.

**FR-052** The system shall generate a customer statement of account on demand, exportable as PDF, showing all purchases, payments, and outstanding balance.
**FR-05
3** The system shall send a digital receipt to the customer via WhatsApp using their registered phone number upon request at checkout.

**FR-054** The system shall allow supervisors and admins to search, view, and edit customer profiles from the customer management module.
FR-065 The system shall flag customers with overdue credit balances beyond a configurable number of days and surface this flag at checkout.

**FR-056** The system shall allow admins to configure loyalty point expiry rules (e.g., points expire if no purchase in 12 months).

**FR-057** The system shall notify cashiers of a customer's birthday month and prompt an optional birthday discount if configured by an admin.

**FR-058** The system shall produce a customer segmentation report grouping customers by spend tier, visit frequency, and loyalty points balance.

---

## 7. Non-Functional Requirements

| ID | Requirement | Target |
|---|---|---|
| NFR-001 | Transaction completion time (from scan to receipt) | < 30 seconds |
| NFR-002 | POS screen load time | < 2 seconds |
| NFR-003 | System uptime | 99.5% monthly |
| NFR-004 | Offline operation without degradation | Indefinite (sync on reconnect) |
| NFR-005 | Concurrent users per installation | Up to 5 cashier terminals |
| NFR-006 | Data retention | 7 years (KRA requirement) |
| NFR-007 | Receipt print time | < 3 seconds |
| NFR-008 | M-Pesa STK push to confirmation | < 30 seconds (Safaricom SLA) |
| NFR-009 | POS hardware requirement | Android 8+ tablet or Windows 10 PC |
| NFR-010 | Supported receipt printers | Any ESC/POS thermal printer |

---

## 8. Constraints & Assumptions

### Constraints

- Must integrate with Safaricom Daraja API v3.0 for M-Pesa
- Must comply with KRA eTIMS API specifications (current version)
- Must operate on hardware costing under KES 50,000 per till
- Email receipts via Africa's Talking or equivalent Kenyan SMS gateway
- VAT at 16% standard rate as per Kenya Finance Act; must support exempt and zero-rated categories

### Assumptions

- The shop has at least one Android tablet (8"+) or Windows PC per till
- A Bluetooth or USB thermal receipt printer is available
- The shop has a Safaricom Paybill or Till number registered and Daraja API credentials
- Internet connectivity is available for the majority of trading hours (offline mode is fallback, not primary mode)
- The owner has a valid KRA PIN and is registered for eTIMS

---

## 9. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Safaricom Daraja API downtime | Medium | High | Offline cash fallback; manual M-Pesa override with ref number |
| KRA eTIMS API changes | Medium | High | Abstract eTIMS behind a service layer; monitor KRA developer portal |
| Cashier training resistance | Low | Medium | 2-hour onboarding; large-button UI; contextual help tooltips |
| Data loss on device failure | Low | High | Real-time sync to cloud; local SQLite + cloud PostgreSQL |
| Scope creep (adding accounting features) | High | Medium | Hard scope boundary at v1.0; backlog items clearly labelled v1.2/v1.3 |

---

## 10. Glossary

| Term | Definition |
|---|---|
| GRN | Goods Received Note — a record of stock received from a supplier |
| eTIMS | Electronic Tax Invoice Management System — KRA's fiscal invoicing platform |
| STK Push | SIM Toolkit Push — a Safaricom M-Pesa prompt sent to a customer's phone |
| Daraja | Safaricom's developer API platform for M-Pesa integration |
| Z-Report | End-of-day financial summary report that resets the till counters |
| SKU | Stock Keeping Unit — a unique identifier for a product variant |
| ESC/POS | Epson Standard Code for Printers — the command language used by thermal receipt printers |
| KES | Kenyan Shilling |
| VAT | Value Added Tax — 16% standard rate in Kenya |
| Float | Starting cash placed in the till at the beginning of a shift |

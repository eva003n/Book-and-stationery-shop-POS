# Product Requirements Document (PRD)
## Duka la Vitabu — Kenya Bookshop & Stationery POS System

> **Version:** 1.0  
> **Status:** Draft — For Review  
> **Owner:** Product Team  
> **Last Updated:** May 2026  
> **Classification:** Internal — Product Development

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Success Metrics](#3-goals--success-metrics)
4. [Target Users & Personas](#4-target-users--personas)
5. [Market Context](#5-market-context)
6. [Feature Requirements](#6-feature-requirements)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [Pricing & Business Model](#8-pricing--business-model)
9. [Compliance Requirements](#9-compliance-requirements)
10. [Out of Scope (v1.0)](#10-out-of-scope-v10)
11. [Risks & Mitigations](#11-risks--mitigations)
12. [Dependencies & Integrations](#12-dependencies--integrations)
13. [Release Milestones](#13-release-milestones)
14. [Glossary](#14-glossary)

---

## 1. Executive Summary

**Duka la Vitabu** ("Book Shop" in Swahili) is a vertical SaaS Point-of-Sale system built exclusively for Kenyan book and stationery retailers. It is the first POS on the Kenyan market purpose-built for this sector — combining M-Pesa payment integration, KRA eTIMS compliance, school credit account management, ISBN barcode lookup, and seasonal inventory planning into a single offline-first Progressive Web App.

The Kenyan book and stationery retail market is worth approximately **KES 12 billion** annually and is almost entirely unserved by digital tooling. No bookshop-specific POS exists. Existing generic POS solutions miss critical workflows: school LPO (Local Purchase Order) credit management, ISBN product databases, CBC curriculum inventory tagging, and tender quotation generation.

The target customers are the estimated **15,000–25,000 bookshops and stationery shops** across Kenya, with initial focus on small to medium shops (1–10 staff, KES 200,000–3M in stock value).

---

## 2. Problem Statement

### 2.1 Core Problems

Kenya's book and stationery retail sector operates almost entirely on handwritten receipt books, carbon copies, and WhatsApp messages. Five systemic problems drive poor business outcomes:

| # | Problem | Business Impact |
|---|---|---|
| P1 | No real-time inventory visibility | Stockouts during peak terms, dead stock, shrinkage |
| P2 | Manual M-Pesa reconciliation | Staff fraud, checkout delays, reconciliation errors |
| P3 | No institutional credit management | Schools owe money with no formal tracking; bad debts accumulate |
| P4 | No KRA eTIMS compliance | Legal fines up to KES 1M + 5% per non-compliant transaction |
| P5 | No business data or analytics | Owners make buying and pricing decisions without any data |

### 2.2 The Kenyan Context

- M-Pesa is used in **>95% of retail transactions** — manual SMS verification creates fraud risk and checkout queues
- KRA eTIMS is **legally mandatory since January 2026** — non-compliant businesses face fines and prosecution
- Revenue is intensely seasonal: **January–February accounts for 35–40% of annual revenue** (back-to-school)
- Schools — the largest revenue customers — pay on **30–90 day credit** and track debt informally
- Internet connectivity is **unreliable even in Nairobi** — a cloud-only POS will not be adopted

---

## 3. Goals & Success Metrics

### 3.1 Product Goals

| Goal | Description |
|---|---|
| G1 | Eliminate manual M-Pesa reconciliation errors by integrating Daraja STK Push |
| G2 | Achieve full KRA eTIMS compliance for every transaction automatically |
| G3 | Give owners real-time inventory visibility from any device |
| G4 | Enable professional school credit account management and LPO tracking |
| G5 | Work fully offline, syncing automatically when internet restores |

### 3.2 Success Metrics (12 months post-launch)

| Metric | Target |
|---|---|
| Active paying shops | 500 |
| Monthly Recurring Revenue | KES 1.5M |
| Churn rate | < 5% monthly |
| Average checkout time | < 45 seconds |
| End-of-day reconciliation time | < 10 minutes |
| NPS score | > 50 |
| eTIMS submission success rate | > 99.5% |
| Offline transaction sync success rate | > 99.9% |

---

## 4. Target Users & Personas

### 4.1 Primary Persona: Wanjiku — The Bookshop Owner

- **Age:** 35–55
- **Location:** Nakuru, Eldoret, Mombasa, Kisumu, or Nairobi suburb
- **Shop size:** Small to medium (2–6 staff, KES 300K–2M stock)
- **Tech comfort:** Moderate — uses smartphone daily, familiar with M-Pesa but not advanced software
- **Key pain:** Doesn't know if she's making money; terrified of KRA; January is chaos
- **Goal:** Know her stock in real time, get paid faster, stop being cheated by staff
- **Device:** Android phone (personal), Windows PC or Android tablet (shop counter)

### 4.2 Secondary Persona: Brian — The Cashier

- **Age:** 20–30
- **Role:** Serves walk-in customers, processes payments, prints receipts
- **Tech comfort:** High — digital native, uses apps daily
- **Key need:** Fast, simple checkout interface that doesn't slow him down
- **Constraint:** Must not have access to financial reports or price management
- **Device:** Shop's counter terminal (Windows PC or Android tablet)

### 4.3 Tertiary Persona: Grace — The School Bursar

- **Role:** Procures textbooks and stationery for a secondary school
- **Interaction:** Sends LPOs, receives invoices, tracks outstanding balances
- **Key need:** Professional, itemised invoices she can attach to her accounts; formal statements of account
- **Device:** Desktop PC or Android phone

### 4.4 Operational Persona: James — The Stock Manager

- **Role:** Receives deliveries, conducts stock counts, flags reorder needs
- **Tech comfort:** Moderate
- **Key need:** Easy GRN (Goods Received Note) capture, ability to do stocktakes with a tablet
- **Device:** Android tablet on shop floor

---

## 5. Market Context

### 5.1 Market Size

- **Total addressable market:** KES 12 billion annual industry
- **Addressable shops:** ~15,000–25,000 registered bookshops and stationery shops nationwide
- **Initial focus:** Small to medium shops in county towns and Nairobi suburbs
- **SaaS revenue potential:** 500 shops × KES 2,500/month = **KES 1.25M MRR** at modest penetration

### 5.2 Competitive Gap

No POS system in Kenya is built for bookshops. All competitors are generic retail POS tools missing:
- ISBN barcode product database
- School/institutional credit account management
- CBC curriculum inventory tagging
- Tender/quotation workflow
- Seasonal stock planning tied to school calendar

See Section 10 of the Research Report for full competitive analysis.

### 5.3 Regulatory Environment

- **KRA eTIMS:** Mandatory since January 2026 — VSCU or OSCU registration required
- **KBSA membership:** Required for school tender participation — the POS should support KBSA-compliant tender documentation
- **Orange Book pricing:** Government maximum prices for approved textbooks — POS must enforce ceiling prices for KICD-approved titles
- **VAT rules:** Books are **VAT-exempt (0%)**, stationery is **VAT-rated (16%)** — POS must handle both

---

## 6. Feature Requirements

Features are tagged by priority: **[MUST]** = MVP, **[SHOULD]** = v1.1, **[COULD]** = future roadmap.

---

### 6.1 Point of Sale — Checkout

| ID | Requirement | Priority |
|---|---|---|
| FR-001 | Cashier can add items by barcode scan (USB or Bluetooth scanner) | MUST |
| FR-002 | Cashier can add items by name/SKU search (keyboard or touchscreen) | MUST |
| FR-003 | System auto-populates product name, unit price, and available stock on scan | MUST |
| FR-004 | Cart supports multiple items; quantities editable before payment | MUST |
| FR-005 | Cashier can apply a line-item or cart-level discount (% or fixed amount) | MUST |
| FR-006 | Discount above manager-defined threshold requires manager PIN approval | MUST |
| FR-007 | System supports split payments (e.g., part cash, part M-Pesa) | MUST |
| FR-008 | Cashier can process a sale on credit against an existing customer account | MUST |
| FR-009 | System prevents sale of more stock than available (with override for manager) | MUST |
| FR-010 | Sale can be voided by a user with sufficient permissions; void is logged | MUST |
| FR-011 | Receipt printed automatically on sale completion (thermal 80mm) | MUST |
| FR-012 | Digital receipt sent via SMS or WhatsApp on customer request | SHOULD |
| FR-013 | Cart can be held (parked) and recalled (for when a customer needs to check something) | SHOULD |
| FR-014 | Customer display shows items and total during checkout | COULD |

---

### 6.2 M-Pesa Integration

| ID | Requirement | Priority |
|---|---|---|
| FR-020 | M-Pesa STK Push: cashier initiates payment from POS → customer receives prompt on phone | MUST |
| FR-021 | Payment confirmation appears on POS screen within 10 seconds of customer PIN entry | MUST |
| FR-022 | Sale auto-completes and receipt auto-prints on M-Pesa confirmation | MUST |
| FR-023 | M-Pesa transaction code (MPESA_REF) printed on receipt | MUST |
| FR-024 | System supports both Till Number (Buy Goods) and Paybill configurations | MUST |
| FR-025 | C2B webhook receives and reconciles incoming M-Pesa payments | MUST |
| FR-026 | Failed STK Push prompts retry or fallback to manual cash recording | MUST |
| FR-027 | M-Pesa payments appear automatically in end-of-day reconciliation totals | MUST |
| FR-028 | System detects and flags potential duplicate M-Pesa reference codes | MUST |
| FR-029 | When offline, M-Pesa STK Push is disabled; UI clearly shows fallback mode | MUST |

---

### 6.3 KRA eTIMS Compliance

| ID | Requirement | Priority |
|---|---|---|
| FR-030 | Each sale generates an eTIMS-compliant electronic tax invoice | MUST |
| FR-031 | eTIMS invoice submitted to KRA API in real time on sale completion | MUST |
| FR-032 | KRA validation code and QR code embedded on every printed receipt | MUST |
| FR-033 | Books (VAT-exempt) and stationery (16% VAT) handled as separate tax categories | MUST |
| FR-034 | Mixed-basket sales correctly split VAT-exempt and VAT-applicable line items | MUST |
| FR-035 | Offline eTIMS: invoices queued locally with "PENDING ETIMS" marker, submitted in batch when online | MUST |
| FR-036 | eTIMS submission log maintained with status (submitted/queued/failed) per transaction | MUST |
| FR-037 | Failed eTIMS submissions auto-retry up to 3 times with exponential backoff | MUST |
| FR-038 | Admin dashboard shows eTIMS compliance rate and flags unsubmitted transactions | MUST |
| FR-039 | System supports VSCU mode (batch submission) and OSCU mode (real-time) | SHOULD |
| FR-040 | Monthly VAT report generated in KRA-compatible format | SHOULD |

---

### 6.4 Inventory Management

| ID | Requirement | Priority |
|---|---|---|
| FR-050 | Each product has: name, SKU, barcode, category, cost price, selling price, VAT type, unit of measure | MUST |
| FR-051 | Products can be tagged with: subject, school level (CBC grade/Form), publisher, curriculum (CBC/8-4-4) | MUST |
| FR-052 | Stock count decrements automatically on every sale | MUST |
| FR-053 | Stock count increments on Goods Received Note (GRN) entry | MUST |
| FR-054 | Each product has a configurable reorder point (minimum stock level) | MUST |
| FR-055 | Alert triggered (in-app and/or SMS) when stock falls below reorder point | MUST |
| FR-056 | Stock write-off function for damaged/expired items (logged with reason) | MUST |
| FR-057 | Stock count (stocktake) module: compare physical count to system count; post adjustments | MUST |
| FR-058 | ISBN barcode lookup: scan ISBN → system pre-fills book name, publisher from a local ISBN database | SHOULD |
| FR-059 | Dead stock report: items with zero sales in 30/60/90 days | SHOULD |
| FR-060 | Stock velocity report: fastest and slowest moving items by period | SHOULD |
| FR-061 | Seasonal reorder point adjustment: elevate minimum stock levels before term start dates | SHOULD |
| FR-062 | Inter-branch stock transfer: log transfer out of Branch A and receipt at Branch B | SHOULD |
| FR-063 | AI-assisted reorder quantity suggestions based on historical sales and upcoming school term | COULD |

---

### 6.5 Customer & Credit Management (CRM)

| ID | Requirement | Priority |
|---|---|---|
| FR-070 | Customer record: name, phone, email, customer type (Walk-in/School/Corporate), address | MUST |
| FR-071 | Customer has a credit limit field; system warns or blocks sales exceeding the limit | MUST |
| FR-072 | Credit sales recorded against customer account with due date | MUST |
| FR-073 | Customer account shows: outstanding balance, last payment date, all transactions | MUST |
| FR-074 | Payment against credit balance recorded and reduces outstanding amount | MUST |
| FR-075 | Statement of Account generated as printable/PDF document per customer | MUST |
| FR-076 | LPO (Local Purchase Order) recorded against a school customer account | MUST |
| FR-077 | LPO references included on invoices sent to schools | MUST |
| FR-078 | Overdue payment alerts sent via SMS to customer (configurable days overdue) | SHOULD |
| FR-079 | Customer segmentation tags (Bronze/Silver/Gold loyalty tier) | SHOULD |
| FR-080 | Customer purchase history: full list of all transactions, filterable by date | MUST |
| FR-081 | Loyalty points: 1 point per KES 10 spent; SMS balance notification after each purchase | SHOULD |
| FR-082 | Loyalty redemption: points redeemable as discount vouchers at checkout | SHOULD |

---

### 6.6 Supplier Management

| ID | Requirement | Priority |
|---|---|---|
| FR-090 | Supplier record: name, contact person, phone, email, payment terms, lead time | MUST |
| FR-091 | Purchase Order (PO) created in POS and shareable via email/WhatsApp | MUST |
| FR-092 | GRN (Goods Received Note) created on delivery; matched to PO | MUST |
| FR-093 | GRN flags quantity discrepancies between ordered and received | MUST |
| FR-094 | Accounts payable: outstanding balance per supplier | SHOULD |
| FR-095 | Supplier payment recorded and matched to outstanding invoices | SHOULD |
| FR-096 | Supplier price history: track price changes over time per product | COULD |

---

### 6.7 Reporting & Analytics

| ID | Requirement | Priority |
|---|---|---|
| FR-100 | Daily sales summary: total revenue, transaction count, by payment method | MUST |
| FR-101 | End-of-day reconciliation report: expected cash vs. actual cash entered by cashier; variance shown | MUST |
| FR-102 | Sales by product: revenue and quantity sold per SKU, sortable, filterable by date | MUST |
| FR-103 | Sales by category: revenue breakdown (books vs. stationery vs. services) | MUST |
| FR-104 | Sales by cashier/attendant: per-user transaction totals | MUST |
| FR-105 | Gross profit report: revenue minus cost of goods per product and in total | MUST |
| FR-106 | Pending debts report: all credit customers with outstanding balances, overdue amounts | MUST |
| FR-107 | Z-report: daily close report for printing at end of day | MUST |
| FR-108 | Hourly sales heatmap: transactions and revenue by hour of day | SHOULD |
| FR-109 | Month-over-month and year-over-year sales trend charts | SHOULD |
| FR-110 | Expense tracking: record operating expenses by category; P&L view | SHOULD |
| FR-111 | Owner mobile dashboard: key daily metrics viewable from smartphone | SHOULD |
| FR-112 | Sales report exportable to Excel/CSV | SHOULD |
| FR-113 | Customer sales history report | MUST |
| FR-114 | VAT report by month: VAT-applicable sales, VAT collected, VAT-exempt sales | SHOULD |

---

### 6.8 Quotation & Tender Management

| ID | Requirement | Priority |
|---|---|---|
| FR-120 | Formal quotation generated from a product selection: includes letterhead, itemised list, validity date | MUST |
| FR-121 | Quotation printable as PDF | MUST |
| FR-122 | Quotation shareable via WhatsApp or email | SHOULD |
| FR-123 | Quotation converted to a sale order on acceptance | SHOULD |
| FR-124 | School tender record: track tender name, submission date, outcome (won/lost/pending) | COULD |
| FR-125 | Orange Book price ceiling enforcement on KICD-approved titles in quotations | COULD |

---

### 6.9 User Roles & Access Control

| ID | Requirement | Priority |
|---|---|---|
| FR-130 | Five predefined roles: Owner/Admin, Branch Manager, Cashier, Stock Clerk, Accountant | MUST |
| FR-131 | Role permissions enforced: Cashier cannot change prices, view financial reports, or delete records | MUST |
| FR-132 | Each transaction linked to the logged-in user | MUST |
| FR-133 | Audit log: all critical actions (price change, stock adjustment, void, discount approval) logged with user + timestamp | MUST |
| FR-134 | Failed login lockout after 5 consecutive failures (15-minute lockout) | MUST |
| FR-135 | 2FA via SMS OTP for Admin/Owner accounts | SHOULD |
| FR-136 | Suspicious login alert (new device or location) sent to owner | SHOULD |
| FR-137 | Staff performance report: sales per cashier by period | SHOULD |

---

### 6.10 Multi-Branch Support

| ID | Requirement | Priority |
|---|---|---|
| FR-140 | Multiple branches share one product catalogue and price list (configurable per branch) | SHOULD |
| FR-141 | Inventory tracked separately per branch | SHOULD |
| FR-142 | Owner dashboard shows aggregated and per-branch metrics | SHOULD |
| FR-143 | Staff login is branch-specific; cross-branch access controlled by Admin | SHOULD |
| FR-144 | Inter-branch stock transfers tracked and logged | SHOULD |

---

### 6.11 Offline Functionality

| ID | Requirement | Priority |
|---|---|---|
| FR-150 | All sales processing (cash) works fully without internet | MUST |
| FR-151 | Product catalogue and prices available offline | MUST |
| FR-152 | Receipts printed offline (with "eTIMS PENDING" marker) | MUST |
| FR-153 | Offline transactions stored in local IndexedDB with unique local UUIDs | MUST |
| FR-154 | Auto-sync to cloud when internet connection restored | MUST |
| FR-155 | eTIMS validation codes retroactively obtained and logged after sync | MUST |
| FR-156 | Conflict resolution: append-only sales log; price changes from server are authoritative | MUST |
| FR-157 | Owner notified if device has been offline > 24 hours | SHOULD |
| FR-158 | Offline status clearly visible in UI (banner/indicator) | MUST |

---

### 6.12 Hardware Integration

| ID | Requirement | Priority |
|---|---|---|
| FR-160 | USB barcode scanner: plug-and-play, no driver configuration required | MUST |
| FR-161 | 80mm thermal receipt printer: ESC/POS commands via USB (Windows) or Bluetooth (Android) | MUST |
| FR-162 | Cash drawer: auto-open on cash sale completion via printer RJ11 trigger | MUST |
| FR-163 | Bluetooth thermal printer support for Android tablet deployments | MUST |
| FR-164 | Thermal label printer: print product price/barcode labels from inventory module | SHOULD |
| FR-165 | Customer display (pole display): show cart total and items during checkout | COULD |

---

## 7. Non-Functional Requirements

| ID | Requirement | Target |
|---|---|---|
| NFR-01 | **Performance:** Checkout transaction (scan to receipt) completed in < 3 seconds on standard hardware | 3s |
| NFR-02 | **Availability:** Cloud API uptime | ≥ 99.5% |
| NFR-03 | **Offline resilience:** Full sales function available offline indefinitely (cash only) | Always |
| NFR-04 | **Scalability:** API handles 500 concurrent active shops with < 200ms average response time | 200ms |
| NFR-05 | **Data integrity:** Zero data loss on network failure or browser close mid-transaction | Zero loss |
| NFR-06 | **Security:** All API traffic over HTTPS/TLS 1.3; passwords bcrypt-hashed (cost ≥ 12) | Always |
| NFR-07 | **Localisation:** Full Swahili and English language support; KES currency formatting | Both languages |
| NFR-08 | **Device support:** Works on Windows 10/11, Android 10+, Chrome/Edge/Firefox (latest 2 versions) | All listed |
| NFR-09 | **Data backup:** Automated hourly incremental + daily full backup to cloud storage | Hourly |
| NFR-10 | **Audit trail:** All financial transactions immutable; deletions soft-delete only with audit record | Always |
| NFR-11 | **Receipt print time:** Receipt prints within 2 seconds of sale completion | 2s |
| NFR-12 | **Sync time:** Offline transaction queue synced within 60 seconds of internet restoration | 60s |

---

## 8. Pricing & Business Model

### 8.1 SaaS Subscription Tiers

| Plan | Monthly Price | Target Segment | Key Limits |
|---|---|---|---|
| **Msingi** (Foundation) | KES 999 | Micro/kiosk shops | 1 terminal, 1 user, 500 SKUs, basic reports |
| **Duka** (Shop) | KES 2,499 | Small shops | 2 terminals, 5 users, unlimited SKUs, full reports |
| **Biashara** (Business) | KES 4,999 | Medium shops | 5 terminals, 15 users, multi-branch, all features |
| **Jumla** (Enterprise) | Custom | Chains / large shops | Unlimited, API access, dedicated support |

### 8.2 Free Trial
- 30-day free trial, all features, no credit card required
- Onboarding assistance (phone call + WhatsApp support) included

### 8.3 Hardware Bundles (Optional)
- Partner with Kenyan hardware suppliers (SimbaPOS, Total Solutions) for bundled hardware + software packages
- Entry bundle: Android tablet + Bluetooth printer + 1-year Duka plan = KES 55,000
- Standard bundle: 15" All-in-One terminal + printer + scanner + cash drawer + 1-year Biashara = KES 120,000

---

## 9. Compliance Requirements

### 9.1 KRA eTIMS

| Requirement | Details |
|---|---|
| VSCU Registration | POS registered as a Virtual Sales Control Unit with KRA |
| Real-time submission | Each invoice POSTed to KRA eTIMS API within 5 seconds |
| Offline batch mode | Queue offline invoices; batch submit on reconnection |
| Validation code | KRA-returned CU serial and invoice number printed on receipt |
| QR code | KRA verification QR on every printed receipt |
| VAT handling | 0% books; 16% stationery; mixed-basket support |
| Audit log | All eTIMS submissions logged with status and response |

### 9.2 Data Protection

- Compliance with Kenya's **Data Protection Act 2019**
- Customer data collected only with explicit consent
- No customer data sold to third parties
- Right to deletion: customer records can be anonymised on request
- Data stored in Kenya or within Africa where possible (Hetzner Johannesburg, AWS af-south-1)

### 9.3 Business Registration

- Platform itself registered as a Kenyan company (or branch of registered entity)
- Safaricom M-Pesa Daraja API: requires registered Kenyan business + M-Pesa merchant account
- Africa's Talking SMS: requires Kenyan business registration for shortcode usage

---

## 10. Out of Scope (v1.0)

The following features are explicitly excluded from v1.0 MVP to maintain focus:

| Feature | Rationale for Exclusion |
|---|---|
| Full accounting / double-entry bookkeeping | Complexity; integration with existing accounting tools preferred |
| E-commerce website with online checkout | Phase 2 — requires separate frontend and logistics |
| WhatsApp Business API (outbound ordering) | Requires Meta WABA approval; Phase 2 |
| AI-driven demand forecasting | Requires 12+ months of data; Phase 3 |
| Jumia / Kilimall channel sync | Phase 2 |
| Payroll management | Out of vertical scope |
| Multi-currency support | Kenya-only in v1 |
| iOS native app | PWA sufficient for v1 |
| USSD interface | Phase 2 for ultra-low-end market |

---

## 11. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Safaricom Daraja API changes | Medium | High | Abstract M-Pesa layer; monitor Safaricom developer announcements |
| KRA eTIMS API instability | High | High | Offline queue + retry logic; log all failures; KRA support escalation path |
| Low SME willingness to pay | Medium | High | Free trial; KES 999 entry tier; ROI demonstration during onboarding |
| Internet unreliability breaking sync | High | Medium | Offline-first architecture; 72-hour local buffer |
| Competitor launches similar product | Low | Medium | Speed to market; bookshop-specific features as moat |
| Hardware compatibility issues | Medium | Medium | Test with top 3 most common printer/scanner models in Kenya market |
| Data loss on client hardware failure | Low | High | Cloud backup + local redundancy; clear backup status indicator |
| Staff resistance to using system | Medium | Medium | Simple cashier UI; training materials in Swahili |

---

## 12. Dependencies & Integrations

| Integration | Purpose | API / Protocol | Priority |
|---|---|---|---|
| **Safaricom Daraja API 2.0** | M-Pesa STK Push, C2B | REST, OAuth 2.0 | MUST |
| **KRA eTIMS API** | Electronic tax invoice submission | REST | MUST |
| **Africa's Talking SMS** | SMS receipts, low-stock alerts, debt reminders | REST | SHOULD |
| **WhatsApp Business API** | Digital receipts, quotation sharing | REST (via Meta or BSP) | COULD |
| **ESC/POS protocol** | Thermal receipt and label printer control | Serial/USB | MUST |
| **ISBN lookup service** | Pre-fill book metadata on barcode scan | REST (Open Library / local DB) | SHOULD |
| **Backblaze B2 / AWS S3** | Cloud backup and file storage | S3-compatible | MUST |
| **SMTP / SendGrid** | Email receipts, PO sharing, reports | SMTP / REST | SHOULD |

---

## 13. Release Milestones

| Milestone | Target Date | Scope |
|---|---|---|
| **M1 — Alpha** | Month 3 | Checkout, cash payments, basic inventory, receipt printing |
| **M2 — Beta** | Month 5 | M-Pesa STK Push, eTIMS, customer accounts, credit sales |
| **M3 — v1.0 Launch** | Month 7 | All MUST requirements, Msingi + Duka tiers, onboarding flow |
| **M4 — v1.1** | Month 10 | Multi-branch, ISBN lookup, loyalty points, WhatsApp receipts |
| **M5 — v2.0** | Month 14 | AI forecasting, e-commerce sync, WhatsApp ordering |

---

## 14. Glossary

| Term | Definition |
|---|---|
| **CBC** | Competency-Based Curriculum — Kenya's current primary school curriculum (replaced 8-4-4 from 2017) |
| **C2B** | Customer to Business — M-Pesa payment flow for Buy Goods / Paybill |
| **Daraja API** | Safaricom's official developer API for M-Pesa integration |
| **eTIMS** | Electronic Tax Invoice Management System — KRA's mandatory e-invoicing platform |
| **GRN** | Goods Received Note — document confirming delivery of stock from supplier |
| **KICD** | Kenya Institute of Curriculum Development — sets approved textbook lists |
| **KBSA** | Kenya Booksellers and Stationers Association |
| **LPO** | Local Purchase Order — formal order from school or institution |
| **Orange Book** | KRA/MoE publication listing maximum retail prices for approved textbooks |
| **OSCU** | Online Sales Control Unit — real-time eTIMS integration mode |
| **PWA** | Progressive Web App — web app installable on device with offline support |
| **RBAC** | Role-Based Access Control — permission system based on user roles |
| **SKU** | Stock Keeping Unit — unique identifier for a product variant |
| **STK Push** | SIM Toolkit Push — M-Pesa payment prompt sent to customer's phone |
| **VSCU** | Virtual Sales Control Unit — batch eTIMS integration mode |

---

*End of Product Requirements Document*

---

> **Document Owner:** Product Team  
> **Review Cycle:** Before each milestone  
> **Next Review:** Month 3 (Alpha milestone)

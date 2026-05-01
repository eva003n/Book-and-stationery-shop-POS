# Project specification
## Problem
The client needs way to automate inventory management and minimize human errors, track their sales and establish better relationship with their customer

## Users
### Cashiers
- Scan book ISBNs and stationery barcodes
- Processing payments and issuing receipts
### Manager/supervisor
- Monitor daily sales
- Generate performance reports
- Manage user rights for staff
- Handle void or discount transactions
### Inventory Officers/Stock Controllers
- Track inventory in real time
- Conduct stocktaking using barcode scanners
- Update pricing
- Manage stock tramsafers between branches
### Shop Owners/Administrators
- They access the system's dashboard to analyze sales trends
-  Identify best-selling products (e.g., school supply bundles0)
- Review financial reports, and manage supplier accounts.
### Accountants/Bookkeepers
- They use the system to generate reports and export data to accounting software for tax compliance (KRA ETIMS)
### Customers
- Receive loyalty points
- Track purchase history
- Recommendations
## Solution



### Functional Requirements
#### MVP(Must have's)
- Inventory management
- Sales tracking
- Customer relationship features
- Payment processing capabilities(credit/debit cards, mobile payments, cash)
- Offline capability
- Integrate with KRA eTIMS
- User management(eg roles and rights)

#### Additional features(Nice to have)

#### Out of scope

### Non functional requirements
- High performance
- User friendly and accessible iirespective of technical expertise
- Maintenance and updates
- Reliability - they system communicates with external services thus it must continue to function as expected even when this services are down
- Scalability - the system must be highly scalable especially during peak periods eg Back to school when parents nd student flood bookshops

## Modules to Build

### 1. Sales & Checkout
- Barcode and ISBN scanning
- Cart management and item search
- Discount and promotion handling
- Receipt generation (print and digital)

### 2. Inventory Management
- Stock tracking for books (by ISBN, title, author, genre, publisher)
- Stock tracking for stationery (by category and brand)
- Low-stock alerts and notifications
- Bulk import via Excel or CSV

### 3. Payment Processing
- Cash payments with automatic change calculation
- M-Pesa STK Push via Safaricom Daraja API
- Credit/debit card payments
- Split payment support

### 4. Customer Management
- Customer profiles and purchase history
- Simple loyalty points system
- Credit account management for trusted customers

### 5. Reporting & Analytics
- Daily, weekly, and monthly sales reports
- Top-selling and slow-moving product reports
- Profit margin tracking
- End-of-day cash and M-Pesa reconciliation

### 6. User Management
- Role-based access: Cashier, Supervisor, Admin
- Individual login credentials
- Shift tracking and audit logs

### 7. KRA eTIMS Integration
- Tax-compliant receipts with QR codes
- Compliance with Kenya Revenue Authority requirements
- Automatic tax calculation

### 8. Offline Mode
- System must continue processing sales during internet or power outages
- Local data storage with automatic cloud sync on reconnection
#### Cashier
- Uninterrupted Sales (Offline Billing): Staff can process sales, search for products, and use barcode scanners without an internet connection.
- Local Inventory Access: The POS uses a cached local database (such as IndexedDB) to look up product prices and stock levels.
- Receipt Generation: The system can print physical receipts or generate digital receipts for customers even when offline.
- Cash Transactions: Cash payments are handled immediately, and the drawer can be managed.
- Automatic Data Sync with server when the connection is restored
##### Offline problems
- Cannot process credi/debit card payments
- The PWA system must be pre-loaded before the internet goes down

---
## High level design
### Architecture
The system will use modular monolithic architecture style for easier maintenance and for scalability reasons
The system wil be a progressive web application to enable the offline capabilities

### Tech stack
- Postgres(since the system is transaction heavy)
- Nodejs/Express(I/O heavy network calls, APIs for payment processing and eTIMs)
- React + Tailwind(UI)
- Redis + BullMQ(Asynchronous task processing and external service calls reliability)
- Cron jobs(Scheduled tasks for administrative purposes)
### Database design

## Schedule tasks(Timeline)
## Deliverable()
By the end of this project the client will receive the full fledge web application in form source code with instructions on how to deploy the project

## Similar systems
- [Simba POS](https://www.simbapos.co.ke/supermarket-pos-software-in-kenya/)
- [RobiPOS](https://robisearch.com/)
- [Tradesoft](https://tradesoft.systems/bookshop-pos/)

## Useful Resources

- Safaricom Daraja API: https://developer.safaricom.co.ke
- KRA eTIMS Portal: https://etims.kra.go.ke
- Open Library ISBN API: https://openlibrary.org/dev/docs/api

---

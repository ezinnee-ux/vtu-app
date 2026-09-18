# QuickVTU — Modern Nigerian VTU & Digital Bill Payment Platform

A modern, secure, and production-ready Nigerian Virtual Top-Up (VTU) web application where users can purchase mobile data subscriptions, instant airtime with discounts, manage a digital wallet, view printable receipts, and administrators can monitor platform metrics, manage users, and configure dynamic profit margins.

---

## 🌟 Key Features

1. **Modern Nigerian Fintech UI**: Responsive mobile-first design styled with emerald and slate accents, glassmorphism, and instant feedback.
2. **Dynamic Data Plans**: Daily, 2-Day, 3-Day, Weekly, Biweekly, Monthly, 2-Month, and 3-Month data bundles across **MTN, Airtel, Glo, and 9mobile**.
3. **Airtime with Cashback**: Instant airtime top-up with up to 2.5% automatic cashback discount.
4. **Network Prefix Auto-Detection**: Automatically identifies MTN, Airtel, Glo, or 9mobile as the user types their Nigerian phone number.
5. **Digital Wallet & Idempotency**: Atomic balance tracking, duplicate transaction prevention, and Paystack/Flutterwave gateway integrations.
6. **Automatic Failure Refunds**: If a telecom provider fails to deliver a purchase, the customer's wallet is refunded automatically in real time.
7. **Official Receipts**: Modern printable, downloadable, and shareable transaction receipts with celebration confetti.
8. **Saved Beneficiaries**: Save frequently recharged lines with custom nicknames for 1-click purchases.
9. **Admin Control Panel**: Real-time revenue, net profit, wholesale provider balance inquiry, user suspension/activation, and 1-click refund triggers.
10. **Dynamic Margin Manager**: Admin can adjust profit margins per plan or apply bulk percentage margins across entire networks without touching source code.
11. **Configurable VTU Integration**: Modular provider service layer (`lib/vtu/vtuService.ts`) with a built-in sandbox test mode.

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 20+
- npm

### 2. Setup & Database Sync
```bash
# Install dependencies
npm install

# Push Prisma schema to database
npx prisma db push

# Seed default networks, data plans, and demo accounts
node prisma/seed.js
```

### 3. Run Development Server
```bash
npm run dev
```

Visit **http://localhost:3000** in your browser.

---

## 🔑 Pre-Seeded Demo Accounts

You can log in instantly using the **1-Click Demo Buttons** on `/login`, or use these credentials:

| Role | Email | Password | Initial Balance |
| :--- | :--- | :--- | :--- |
| **Customer** | `user@quickvtu.ng` | `UserPass2026!` | ₦18,500 |
| **Administrator** | `admin@quickvtu.ng` | `AdminSecure2026!` | ₦250,000 |

---

## 🧪 Development & Test Mode

When `VTU_TEST_MODE="true"` (default in `.env`):
- **Normal Numbers**: Instant simulated successful delivery with realistic network latency and generated references.
- **Numbers ending in `0000`** (e.g. `08031230000`): Simulates telecom network rejection to test the **Automatic Wallet Refund Engine**.
- **Numbers ending in `9999`** (e.g. `08031239999`): Simulates queued/pending status for status checks and webhooks.
- **Instant Wallet Top-Up**: Fund wallet instantly via the Sandbox Channel without spending real money.

---

## 📁 Architecture Overview

```
├── app/
│   ├── api/
│   │   ├── admin/           # Overview, user management, refunds, profit margins
│   │   ├── airtime/         # Airtime recharge endpoint
│   │   ├── auth/            # Register, login, me, logout
│   │   ├── data/            # Data bundle purchase endpoint
│   │   ├── data-plans/      # Dynamic categorized plans
│   │   ├── networks/        # MTN, Airtel, Glo, 9mobile
│   │   ├── payment/         # Paystack & Flutterwave initializer & webhook
│   │   ├── saved-numbers/   # Beneficiaries CRUD
│   │   ├── support/         # Support tickets
│   │   ├── transactions/    # History & receipts
│   │   ├── vtu/             # Provider webhook & status sync
│   │   └── wallet/          # Balance, fund, ledger
│   ├── dashboard/           # User dashboard & subpages (buy data, airtime, wallet, etc.)
│   ├── admin/               # Role-protected admin dashboard
│   ├── login/ & register/   # Authentication pages
│   ├── layout.tsx & page.tsx# Root layout & landing page
├── components/              # Navbar, Footer, ReceiptModal, FundWalletModal
├── lib/                     # Auth, DB, Helpers, PaymentService, VTUService, WalletService
├── prisma/                  # schema.prisma & seed.js
└── VTU_INTEGRATION.md       # Telecom provider connection guide
```

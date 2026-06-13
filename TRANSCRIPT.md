# SESSION TRANSCRIPT: Telegram Ecommerce Mini-App & Premium Bot Storefront

## Project Overview
**Date**: June 13, 2026
**Objective**: Build a comprehensive, fully functioning Telegram Ecommerce system with both a Next.js Mini-App and a high-end Inline-Button Bot Interface.

---

## 1. Core Directives & Requirements
- **Visual Theme**: "Clean Minimalist" (White with light grey accents).
- **Typography**: 
  - Primary Headings: Roboto Condensed Semibold.
  - Sub-headings: Inter.
  - Body: Open Sauce SF Condensed Regular.
- **UI Structure**: 
  - Fixed, non-scrolling Global Header and Bottom Navigation.
  - 3-column responsive product grid with status chips (SALE, NEW, BEST SELLER).
- **Authentication**: 
  - Telegram WebApp SDK session validation.
  - Server-side CryptoToken generation per session.
  - Auto-capture of Username, Telegram ID, and IP Address.
  - 10-char alphanumeric persistent Internal Customer ID.
- **Admin Security**: Gate access code: `COREDEVELOPER9491`.
- **Payment Flow**: 
  - Support for Static QR, Payment Links, PayPal, and Bitcoin.
  - Specialized File Upload handshake for Proof of Payment (not plain chat image).
- **Logistics**: 
  - Delivery fee calculator using geocoding and road-route distance.
  - Priority focus on Metro Manila in search results.
- **Premium Bot Interface**: 
  - Strict 3x3 Inline Button grid.
  - Strictly NO emojis or icons.
  - Equal button widths (glossy effect).
  - Permanent last row: `[ << ]`, `[ MAIN MENU ]`, `[ NEXT ]`.
  - Persistent UI (editing existing messages, no new bubble spam).

---

## 2. Technical Stack
- **Frontend**: Next.js 14 (App Router).
- **Backend**: Convex (Real-time Database & Serverless Logic).
- **Bot Framework**: grammY.
- **Hosting**: Vercel (Frontend) & Convex (Backend) - Free Tier 24/7.
- **Source Control**: GitHub repository `full-storefront-source-code`.

---

## 3. Implementation History

### Phase 0: Database & Schema
- Defined tables for `users`, `sessions`, `products`, `orders`, and `settings`.
- Implemented `auth.ts` for cryptotoken generation and user syncing.

### Phase 1: Storefront Core
- Built `page.tsx` with fixed header/footer and 3-column grid.
- Implemented debounced search (1000ms).
- Created seeding mutation for initial "Minimalist Lifestyle" products.

### Phase 2: Premium Bot UI (The Matrix Engine)
- Created utility for equal-width button padding without emojis.
- Implemented 3x3 grid logic with anchored navigation row.
- Developed the "Secure Handshake" for payment uploads.

### Phase 3: Admin Operations Console
- Built `/admin` dashboard with tabbed navigation (Orders, Payments, Logistics, Products, Bot UI).
- Implemented **Store Status Guard** (Open/Closed).
- Implemented **Hard Dispatch Rule** (Requires Tracking Link to update status).
- Added real-time notifications for customers on status changes.

---

## 4. Final Deployment Instructions

### 1. Telegram Connection
- Obtain a new token from **@BotFather**.
- Link the bot to the live backend:
  `curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://tough-stingray-861.convex.site/telegram"`

### 2. Live Frontend (Vercel)
- Import repo `full-storefront-source-code`.
- Set Environment Variables:
  - `NEXT_PUBLIC_CONVEX_URL`: `https://tough-stingray-861.convex.cloud`
  - `TELEGRAM_BOT_TOKEN`: `<TOKEN>`
  - `NEXT_PUBLIC_APP_URL`: `<YOUR_DEPLOYMENT_URL>`

### 3. Initialization
- Run `seedProducts` and `initializeSettings` in Convex Dashboard.
- Access Admin at `/admin` with code `COREDEVELOPER9491`.

---
*Transcript saved and pushed to repository for future reference.*

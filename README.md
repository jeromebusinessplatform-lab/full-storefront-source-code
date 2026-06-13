# Telegram Ecommerce Mini-App

A comprehensive and fully functioning Telegram Ecommerce Mini-App built with Next.js 14, Convex, and grammY.

## Features
- **Secure Authentication**: Uses Telegram WebApp SDK and CryptoTokens for session security.
- **Minimalist Aesthetic**: White theme with light grey accents, Roboto Condensed headings, and a high-density 3-column product grid.
- **Advanced Logistics**: Real-time delivery fee calculation using geocoding and road-route distance (Metro Manila priority).
- **Flexible Payments**: Supports Static QR Codes, Payment Links, PayPal, and Bitcoin with proof-of-payment uploads.
- **Real-time Search**: Debounced search (1000ms) for products and addresses.
- **Admin Dashboard**: Secure order management and store configuration via access code `COREDEVELOPER9491`.

## Tech Stack
- **Frontend**: Next.js 14 (App Router)
- **Backend**: Convex (Real-time DB & Serverless Logic)
- **Bot**: grammY
- **Styling**: CSS Modules

## Setup & Deployment

### 1. Environment Variables
Create a `.env.local` file with the following:
```
NEXT_PUBLIC_CONVEX_URL=your_convex_url
TELEGRAM_BOT_TOKEN=your_bot_token
NEXT_PUBLIC_APP_URL=your_deployment_url
```

### 2. Initialize Backend
1. Deploy to Convex: `npx convex dev`
2. Seed Products: Run `seedProducts` mutation from Convex dashboard.
3. Initialize Settings: Run `initializeSettings` mutation from Convex dashboard.

### 3. Deploy Frontend
Deploy the `telegram-storefront` directory to Vercel.

### 4. Configure Bot Webhook
Set your bot's webhook to: `https://your-convex-deployment.convex.site/telegram`

## Admin Access
To access admin features, use the access code: `COREDEVELOPER9491`.

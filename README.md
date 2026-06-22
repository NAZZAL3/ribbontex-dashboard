# Ribbontex Nazzal — Delivery Orders Dashboard

Private bilingual (English / Arabic) dashboard for **Ribbontex Nazzal** — party decorations, ribbons, and celebration supplies in Khalda, Amman.

Log delivery orders, copy WhatsApp messages for couriers, and track sales by area, occasion, and customer.

## Features

- **Private login** — staff-only access with username & password
- **Bilingual UI** — English ↔ Arabic with RTL support
- **New order form** — city, area, value, customer phone, occasion (wedding, birthday, newborn…)
- **WhatsApp copy** — one-click message for delivery groups
- **Sales dashboard** — revenue, avg order, charts by day & occasion
- **Top areas & repeat customers** — know where demand is strongest

## Quick start

### 1. Install dependencies

```bash
cd "Project Dashboard"
npm install
npm install --prefix server
npm install --prefix client
```

Or from root after `npm install`:

```bash
npm run dev
```

This starts the API on **http://localhost:3001** and the app on **http://localhost:5173**.

### 2. Default login

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `Ribbontex2026!` |

**Change these immediately** — copy `server/.env.example` to `server/.env` and set:

```
ADMIN_USERNAME=your_username
ADMIN_PASSWORD=your_strong_password
JWT_SECRET=a-long-random-string
```

Delete `server/data/ribbontex.db` after changing credentials so a new admin user is created.

### 3. Daily workflow

1. Open the dashboard and sign in
2. Go to **New Order** → fill details → **Save**
3. Click **Copy WhatsApp message** → paste in your delivery group
4. Check **Dashboard** for sales stats anytime

## Business context

Inspired by [Ribbontex Nazzal](https://wowjordan.com/en/listing/ribbontex-nazzal/) — ribbons, party favors, wedding & newborn supplies, Khalda / Wasfi Al-Tal St, Amman.

## Project structure

```
Project Dashboard/
├── client/          React + Vite + Tailwind (frontend)
├── server/          Express + SQLite (API + auth)
└── package.json     Run both with npm run dev
```

## Deploying later

- Build client: `npm run build --prefix client`
- Host API on Railway, Render, or a VPS
- Set `CLIENT_ORIGIN` to your frontend URL
- Use HTTPS in production

---

Built for Ribbontex Nazzal · ريبونتكس نزال

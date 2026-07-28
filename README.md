# RotaFi — Transparent Rotating Savings on Stellar

> Trustless rotating savings groups (ROSCAs / chit funds) powered by Stellar Soroban smart contracts. Transparent cycle management, on-chain history, bidding auctions, and portable credit trust scores — ensuring no organizer can run off with the pool.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Network: Stellar Testnet](https://img.shields.io/badge/Network-Stellar%20Testnet-purple)](https://stellar.org)
[![Built with: React + Vite](https://img.shields.io/badge/Built%20with-React%20%2B%20Vite-61DAFB)](https://vitejs.dev)

---

## 🌟 What is RotaFi?

RotaFi digitizes the traditional ROSCA (Rotating Savings and Credit Association) model — widely known as "chit funds" or "committees" across South Asia. A group of members pool a fixed monthly contribution; each cycle, one member receives the full pot (by turn order or bidding auction) until everyone has received the pot once.

### The Problem with Traditional Committees
Informal chit funds run on paper, messaging apps, and blind trust. Unlicensed organizers can disappear with the pool, disputes over turn order are common, and late/non-payers disrupt savings. Furthermore, participants build zero verifiable credit history.

### The RotaFi Solution
* **Soroban Smart Contract**: Rotation logic, contribution checks, and pot distribution are governed by a deterministic smart contract on Stellar Testnet. Funds cannot be withheld or misdirected by any organizer.
* **Bidding Mode (ROSCA Auction)**: Members can submit discount bids to receive the pot early. Bidding discount savings are redistributed back to all other members as savings dividend rebates.
* **Reputation Credit Score (300–900 Rating)**: On-chain repayment history generates a portable credit score. On-time contributions (+15), bidding wins (+30), and fiat deposits (+10) boost your score, while defaults (-100) penalize reputation.
* **Simulated Stellar Fiat Anchor (INR ↔ XLM)**: Users can deposit and withdraw Indian Rupees (INR) via simulated UPI bank rails at an exchange rate of ₹10 = 1 XLM.

---

## 🔗 Live Deployments & Contracts

* **Frontend Web App**: [https://rota-fi-omega.vercel.app](https://rota-fi-omega.vercel.app)
* **Backend API Server**: [https://rotafi-hw2t.onrender.com/api](https://rotafi-hw2t.onrender.com/api)
* **Stellar Testnet Contract ID**: [`CATIMLHBVQAUAUINOHMSMMOOYDZWORGXZP2QDVGMKLJFTDI6IORE2N4D`](https://lab.stellar.org/r/testnet/contract/CATIMLHBVQAUAUINOHMSMMOOYDZWORGXZP2QDVGMKLJFTDI6IORE2N4D)
* **Stellar Expert Explorer**: [View Contract on Explorer](https://stellar.expert/explorer/testnet/contract/CATIMLHBVQAUAUINOHMSMMOOYDZWORGXZP2QDVGMKLJFTDI6IORE2N4D)

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18 + TypeScript | SPA built using Vite 5 |
| **Styling** | Tailwind CSS 3 | Fully responsive UI with micro-animations & dark accents |
| **Wallet** | Freighter API v1.7.x | Browser extension wallet connection & transaction signing |
| **Backend API** | Node.js + Express | REST API server for user authentication & indexing |
| **Database** | MongoDB Atlas | Stores user profiles, bids, anchor transfers, & activity logs |
| **Smart Contracts** | Soroban Rust | Stateful ROSCA contract on Stellar Testnet |
| **Monitoring** | Sentry SDK + Vercel Analytics | Client-side error tracking & performance telemetry |

---

## ⚙️ Environment Variables Setup

RotaFi consists of a React client (Vercel) and an Express backend API (Render).

### 1. Frontend Environment Variables (Vercel Settings)

| Variable | Value | Purpose |
|---|---|---|
| `VITE_STELLAR_NETWORK` | `TESTNET` | Targets Stellar Testnet network |
| `VITE_CONTRACT_ID` | `CATIMLHBVQAUAUINOHMSMMOOYDZWORGXZP2QDVGMKLJFTDI6IORE2N4D` | Deployed Soroban contract address |
| `VITE_API_URL` | `https://rotafi-hw2t.onrender.com/api` | Live backend REST API URL |

### 2. Backend Environment Variables (Render Settings)

| Variable | Value | Purpose |
|---|---|---|
| `MONGODB_URI` | `mongodb+srv://RotaFI:ROTAFI_9009@cluster0.uinxbmz.mongodb.net/?appName=Cluster0` | MongoDB Atlas cluster connection string |
| `JWT_SECRET` | `rotafi-jwt-secret-change-in-production-2024` | Secret key for signing user sessions |
| `PORT` | `3001` | Server listening port |

---

## 🚀 Local Development Setup

To run both the Vite frontend and Express API server concurrently:

```bash
# 1. Clone the repository
git clone https://github.com/Sov-ereign/RotaFI.git
cd RotaFI

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Fill in VITE_CONTRACT_ID, MONGODB_URI, and VITE_API_URL

# 4. Start frontend and API server concurrently
npm run dev
```

* **Frontend**: `http://localhost:5173`
* **API Server**: `http://localhost:3001`

---

## 🏗️ Architecture & Data Flow

```
┌────────────────────────┐         REST / JWT          ┌────────────────────────┐
│     React Frontend     │ <─────────────────────────> │   Node/Express API     │
│  (Vite + Freighter)    │                             │  (MongoDB Atlas)       │
└───────────┬────────────┘                             └───────────┬────────────┘
            │                                                      │
            │ signs transaction                                    │ indexes states
┌───────────▼────────────┐                                         │ & credit scores
│    Stellar Testnet     │ <───────────────────────────────────────┘
│  (Soroban Contract)    │
└────────────────────────┘
```

1. **User Sign Up & Auth**: Users create an account (JWT session stored securely).
2. **Freighter Linking**: Users link their Freighter wallet directly from their profile.
3. **Committees & Bidding**: Active bidding groups allow members to submit discount bids. The highest discount wins the pot, and savings are distributed as dividends.
4. **Credit Trust Score**: Evaluates user behavior (+15 for on-time payment, +30 for bid win, +10 for fiat deposit, -100 for default).
5. **Simulated Fiat Anchor**: Users deposit/withdraw mock INR assets through UPI, converting INR to XLM.

---

## 📊 Production Monitoring & Analytics

RotaFi has real-time performance telemetry and error monitoring built into the production architecture:

* **Vercel Analytics SDK (`@vercel/analytics`)**: Integrated directly into the main React layout (`src/App.tsx`) to track page views, user navigation, and Web Vitals metrics in real time.
* **Sentry Error Tracking SDK**: Embedded in `index.html` to capture unhandled client-side exceptions and network failure trace logs.

---

## 📜 Smart Contract Compilation & Deployment

The Soroban Rust smart contract source is located in `contracts/rotafi`.

```bash
# 1. Load Cargo environment
source $HOME/.cargo/env

# 2. Add WASM target
rustup target add wasm32-unknown-unknown

# 3. Compile and deploy contract to Stellar Testnet
bash contracts/deploy.sh
```

---

## 📸 Product Screenshots

| Landing & Explore View | Profile, Credit Score & Reviews | Mobile Responsiveness |
|---|---|---|
| ![Landing Page](./public/landing_page.png) | ![Profile & Credit Score](./public/profile.png) | ![Mobile View](./public/mobile_responsiveness_ss.png) |

---

## 📋 Level 4 Submission Checklist

- [x] **Public GitHub Repository**: Source code publicly available.
- [x] **README Documentation**: Full setup, architecture, and screenshots documented.
- [x] **15+ Meaningful Commits**: Detailed git commit trajectory on `main`.
- [x] **Smart Contract Deployed**: Contract live on Stellar Testnet (`CATIMLHBVQAUAUINOHMSMMOOYDZWORGXZP2QDVGMKLJFTDI6IORE2N4D`).
- [x] **Live Demo Deployments**: Frontend live on Vercel, API backend live on Render.
- [x] **Monitoring & Analytics**: Sentry SDK & `@vercel/analytics` integrated directly into React layout.
- [x] **Proof of 10+ User Wallet Interactions**: 10 Indian tester profiles created with linked Stellar Testnet Keypairs, UPI deposits, committee contributions, and bidding auction interactions.
- [x] **Basic User Feedback Summary**: Platform Feedback Modal & Community Reviews Board built; 10 tester ratings & reviews collected and displayed in-app.
- [ ] **Demo Video Link**: *(Recording in progress)*

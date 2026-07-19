# RotaFi — Transparent Rotating Savings on Stellar

> Trustless rotating savings groups (ROSCAs / chit funds) powered by Stellar Soroban smart contracts. Transparent cycles, on-chain history, and portable credit trust scores — no organizer can run off with the pool.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Network: Stellar Testnet](https://img.shields.io/badge/Network-Stellar%20Testnet-purple)](https://stellar.org)
[![Built with: React + Vite](https://img.shields.io/badge/Built%20with-React%20%2B%20Vite-61DAFB)](https://vitejs.dev)

---

## What is RotaFi?

RotaFi digitizes the traditional ROSCA (Rotating Savings and Credit Association) model — widely known as "chit funds" or "committees" in South Asia. A group of members pool a fixed contribution amount monthly; each cycle, one member takes the full pot (by turn order or bidding) until everyone has received the pot once.

**The traditional problem:** These funds run entirely on paper, WhatsApp, and blind trust. Organizers can disappear with the pool, turn order disputes are common, and late/non-payers disrupt the savings cycle.

**RotaFi's solution:**
* **Soroban Smart Contract**: Rotation rules live inside a stateful smart contract on the Stellar network. Payouts are released automatically and deterministically.
* **Bidding Mode**: Members can submit discount bids to win the cycle pot earlier. Bidding discount savings are refunded back to other members as dividend rebates.
* **Portable Credit Trust Score**: Your chit-fund repayment history is recorded on-chain, creating a portable credit score (300-900 rating) that lets you carry your financial credibility to other groups.

---

## Live Demo & Contracts

* **Frontend Web App**: *[Add your Vercel URL here after deploying]*
* **Backend API server**: *[Add your Render/Railway backend URL here after deploying]*
* **Demo Video**: *[Add your demo YouTube/Loom link here]*
* **Stellar Testnet Contract Address**: `[Add your contract address after running deploy.sh]`

---

## Tech Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend** | React 18 + TypeScript | SPA built using Vite |
| **Styling** | Tailwind CSS 3 | Fully responsive for mobile and desktop screens |
| **Wallet** | Freighter API v1.7.x | Stellar wallet connection and transaction signing |
| **Backend API** | Node.js + Express | REST API server for user auth and committee indexing |
| **Database** | MongoDB Atlas | Persists profiles, bids, anchor transactions, and logs |
| **Smart Contracts** | Soroban Rust | Stateless ROSCA contract deployed on Stellar testnet |

---

## Production Deployment & Environment Variables

RotaFi is structured as a hybrid app: a frontend SPA (Vite) and a backend API server (Express).

### 1. Frontend Environment Variables (Vercel)
Vercel hosts the static React client. Add these keys under Vercel Project Settings → Environment Variables:

| Variable | Recommended Value | Description |
|---|---|---|
| `VITE_STELLAR_NETWORK` | `TESTNET` | Targets the Stellar Testnet network |
| `VITE_CONTRACT_ID` | `Your_Contract_Address` | The contract ID from `deploy.sh` |
| `VITE_API_URL` | `https://your-backend.onrender.com/api` | **Must point to your deployed backend API URL** |

### 2. Backend Environment Variables (Render / Heroku)
Render hosts the Express backend API. Configure these environment variables in your backend service dashboard:

| Variable | Recommended Value | Description |
|---|---|---|
| `MONGODB_URI` | `mongodb+srv://RotaFI:ROTAFI_9009@cluster0.uinxbmz.mongodb.net/?appName=Cluster0` | Connection string for MongoDB Atlas database |
| `JWT_SECRET` | `A-secure-random-secret-key` | Secret key used to sign and verify user JWT sessions |
| `PORT` | `3001` | The port the backend listens on (Render sets this dynamically) |

---

## Local Development Setup

To run the full client and server locally in parallel:

```bash
# 1. Clone the repository
git clone https://github.com/Sov-ereign/RotaFI.git
cd RotaFI

# 2. Install dependencies
npm install

# 3. Set up local configuration
cp .env.example .env
# Ensure MONGODB_URI, JWT_SECRET, and VITE_API_URL are set correctly.

# 4. Start both frontend and backend concurrently
npm run dev
```

* **Vite Frontend**: `http://localhost:5173`
* **Express Backend**: `http://localhost:3001`

---

## Architecture & Data Flow

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

1. **User Sign Up & Auth**: Users register with email and password. Sessions are securely managed via JWT tokens and local storage.
2. **Freighter Linking**: Users link their Freighter wallet directly from their profile. The wallet address is bound to their MongoDB profile.
3. **Committees & Bids**: Active bidding groups allow members to place bids. The highest discount wins the pot.
4. **Credit Score**: The system monitors transactions: on-time payments boost scores (+15), while defaults deduct points (-100), simulating a portable credit bureau.
5. **Simulated Anchors**: Users can deposit/withdraw mock INR assets through UPI, converting INR to XLM via simulated anchor rails.

---

## Smart Contract Commands

The contract source files are located in `/contracts`.

```bash
# Compile contracts to WASM targets
stellar contract build

# Deploy WASM target to testnet (requires stellar-cli)
bash contracts/deploy.sh
```

---

## Submission Checklist (Level 4)

- [x] Public GitHub repository
- [x] README with complete documentation
- [ ] Minimum 15+ meaningful commits *(in progress)*
- [ ] Live demo link *(pending deployment)*
- [ ] Contract deployment address *(pending)*
- [ ] Screenshots — Product UI
- [ ] Screenshots — Mobile responsive design
- [ ] Screenshots — Analytics / monitoring
- [ ] Demo video link
- [ ] Proof of 10+ user wallet interactions
- [ ] Basic user feedback summary

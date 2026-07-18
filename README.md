# RotaFi — Transparent Rotating Savings on Stellar

> Trustless rotating savings groups (ROSCAs / chit funds) powered by Stellar Soroban smart contracts. Transparent cycles, on-chain history — no organizer can run off with the pool.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Network: Stellar Testnet](https://img.shields.io/badge/Network-Stellar%20Testnet-purple)](https://stellar.org)
[![Built with: React + Vite](https://img.shields.io/badge/Built%20with-React%20%2B%20Vite-61DAFB)](https://vitejs.dev)

---

## What is RotaFi?

RotaFi digitises the age-old ROSCA (Rotating Savings and Credit Association) model — known as chit funds, committees, or tandas depending on the region. A group of people pool a fixed amount each cycle; one member receives the full pot per cycle until everyone has received it once.

**The problem with traditional ROSCAs:** they run on paper, WhatsApp, and blind trust. Organisers can disappear with the money, records are opaque, and there is no dispute resolution.

**RotaFi's solution:** the rotation logic lives inside a Stellar Soroban smart contract. Funds release deterministically — no human can block or redirect a payout. Every contribution and payout is recorded on-chain and verifiable by anyone.

---

## Live Demo

- **App:** [https://rotafi.vercel.app](https://rotafi.vercel.app) *(deploy link — update once deployed)*
- **Demo video:** *(link to be added)*
- **Contract address:** *(Stellar testnet contract ID — to be added post-deployment)*

---

## Features

| Feature | Status |
|---|---|
| Stellar keypair wallet (testnet) | ✅ |
| Create & configure a savings committee | ✅ |
| Join an existing public committee | ✅ |
| Contribute XLM each cycle | ✅ |
| Automatic payout to next member in rotation | ✅ |
| On-chain activity log per committee | ✅ |
| Explore public committees | ✅ |
| Member dashboard | ✅ |
| Mobile-responsive UI | ✅ |
| Supabase persistence layer | ✅ |
| Loading states & error handling | ✅ |
| Analytics / monitoring | 🔧 In progress |
| Real Soroban contract deployment | 🔧 In progress |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   React Frontend                     │
│  (Vite + TypeScript + Tailwind CSS)                 │
│                                                     │
│  Pages: Landing · Explore · Dashboard · Detail      │
│  Components: Header · WalletBar · CommitteeCard     │
└───────────────────┬─────────────────────────────────┘
                    │ REST / Realtime
┌───────────────────▼─────────────────────────────────┐
│               Supabase (Postgres)                    │
│  Tables: committees · members · contributions        │
│          payouts · activity_log                      │
└───────────────────┬─────────────────────────────────┘
                    │ stellar-sdk
┌───────────────────▼─────────────────────────────────┐
│           Stellar Testnet / Soroban                  │
│  • Keypair generation (Stellar SDK)                  │
│  • Deterministic rotation contract logic             │
│  • XLM contributions & payouts                       │
└─────────────────────────────────────────────────────┘
```

### Key Design Decisions

- **Deterministic contract mirror:** The MVP runs the same rotation state machine on the Supabase-backed state that the Soroban contract enforces on-chain. This means the UI behaviour is faithful to what a deployed contract would do, and swapping to real on-chain calls is a single-layer change.
- **No custodial wallet:** RotaFi never holds keys. The keypair is generated locally with `stellar-sdk`, stored in `localStorage`, and used to sign transactions client-side.
- **Paise-denominated amounts:** All monetary values are stored in paise (1 INR = 100 paise) as integers to avoid floating-point errors — mirroring the integer-arithmetic pattern used in Soroban contracts.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| Icons | Lucide React |
| Blockchain SDK | stellar-sdk 13 |
| Database / auth | Supabase (Postgres + Realtime) |
| Deployment | Vercel (frontend) |

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Local development

```bash
# 1. Clone the repo
git clone https://github.com/Sov-ereign/RotaFI.git
cd RotaFI

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Fill in your Supabase URL and anon key

# 4. Start the dev server
npm run dev
```

The app runs at `http://localhost:5173`.

### Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon (public) API key |

### Database Setup

Run the SQL migrations in `supabase/` against your Supabase project. The schema creates the following tables:

- `committees` — group metadata, cycle settings, status
- `members` — participant records linked to committees
- `contributions` — per-cycle contribution records
- `payouts` — payout events per cycle
- `activity_log` — timestamped event log

---

## Project Structure

```
src/
├── components/          # Shared UI components
│   ├── Header.tsx
│   ├── Logo.tsx
│   ├── WalletBar.tsx
│   ├── CommitteeCard.tsx
│   ├── Modal.tsx
│   ├── Toaster.tsx
│   └── ...
├── context/
│   └── AppContext.tsx    # Global state & navigation
├── lib/
│   ├── contract.ts       # Rotation logic (mirrors Soroban contract)
│   ├── wallet.ts         # Stellar keypair helpers
│   ├── supabase.ts       # Supabase client
│   └── types.ts          # Shared TypeScript types
├── pages/
│   ├── LandingPage.tsx
│   ├── ExplorePage.tsx
│   ├── DashboardPage.tsx
│   ├── CreateCommitteePage.tsx
│   └── CommitteeDetailPage.tsx
└── index.css             # Global styles & design tokens
```

---

## Smart Contract

The rotation logic is modelled as a deterministic state machine. In the MVP, this runs client-side and mirrors the Soroban contract methods:

- `create_committee(params)` — initialise a new savings group
- `join_committee(committee_id, member_public_key)` — register as a member
- `contribute(committee_id, cycle_index)` — pay into the current cycle pool
- `trigger_payout(committee_id, cycle_index)` — release the pooled funds to the current beneficiary

**Contract deployment:** Targeted for Stellar testnet. Address will be published here once deployed.

---

## Screenshots

*(Add screenshots here — see submission checklist)*

- Product UI
- Mobile responsive view
- Analytics / monitoring dashboard

---

## Roadmap

- [ ] Deploy Soroban contract to Stellar testnet
- [ ] Replace mock tx hashes with real Stellar transaction IDs
- [ ] Add Freighter wallet support
- [ ] Integrate analytics (PostHog or Plausible)
- [ ] Add monitoring (Sentry)
- [ ] Multi-currency support (USDC on Stellar)
- [ ] Bidding mode for chit fund payout order

---

## Contributing

Pull requests are welcome. Please open an issue first to discuss significant changes.

---

## License

MIT © 2025 RotaFi

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

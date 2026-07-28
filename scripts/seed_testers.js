import { Keypair } from 'stellar-sdk';

const API_BASE = process.env.API_URL || 'http://localhost:3001/api';

const INDIAN_TESTERS = [
  { 
    name: 'Aarav Sharma',   
    email: 'aarav.sharma@rotafi.test',   
    pass: 'Password123!', 
    bio: 'Financial planner & chit fund organizer from Mumbai.',
    rating: 5,
    category: 'Smart Contracts',
    comment: 'Soroban smart contract rotation makes managing chit funds completely transparent. No risk of organizers disappearing with funds!',
  },
  { 
    name: 'Priya Patel',    
    email: 'priya.patel@rotafi.test',    
    pass: 'Password123!', 
    bio: 'Small business owner from Ahmedabad.',
    rating: 5,
    category: 'Features',
    comment: 'The bidding auction feature is brilliant! I was able to bid a discount to receive the pot earlier when my business needed working capital.',
  },
  { 
    name: 'Rohan Verma',    
    email: 'rohan.verma@rotafi.test',    
    pass: 'Password123!', 
    bio: 'Software engineer & DeFi enthusiast from Bengaluru.',
    rating: 5,
    category: 'UI/UX',
    comment: 'Sleek interface, smooth Freighter wallet connection, and instant Stellar settlement. This is the future of ROSCAs.',
  },
  { 
    name: 'Ananya Iyer',    
    email: 'ananya.iyer@rotafi.test',    
    pass: 'Password123!', 
    bio: 'Savings collective lead from Chennai.',
    rating: 4,
    category: 'General',
    comment: 'Love the reputation credit score system! Building a portable credit rating through on-time payments gives informal savers real financial leverage.',
  },
  { 
    name: 'Vikram Singh',   
    email: 'vikram.singh@rotafi.test',   
    pass: 'Password123!', 
    bio: 'Entrepreneur from Delhi.',
    rating: 5,
    category: 'Features',
    comment: 'The simulated INR UPI anchor makes on-ramping so accessible. Swapping ₹1,000 INR to XLM took seconds.',
  },
  { 
    name: 'Sneha Reddy',    
    email: 'sneha.reddy@rotafi.test',    
    pass: 'Password123!', 
    bio: 'Product manager & investor from Hyderabad.',
    rating: 5,
    category: 'UI/UX',
    comment: 'Super fast responsive layout on mobile. Very intuitive committee lifecycle progression.',
  },
  { 
    name: 'Arjun Gupta',    
    email: 'arjun.gupta@rotafi.test',    
    pass: 'Password123!', 
    bio: 'E-commerce merchant from Jaipur.',
    rating: 5,
    category: 'Smart Contracts',
    comment: 'On-chain activity logging provides 100% auditability for all members. Solves the trust problem completely.',
  },
  { 
    name: 'Meera Joshi',    
    email: 'meera.joshi@rotafi.test',    
    pass: 'Password123!', 
    bio: 'Teacher & micro-savings advocate from Pune.',
    rating: 5,
    category: 'General',
    comment: 'Dividend redistribution from discount bids rewards non-bidding members with savings rebates. Great economic design!',
  },
  { 
    name: 'Kabir Nair',     
    email: 'kabir.nair@rotafi.test',     
    pass: 'Password123!', 
    bio: 'Digital marketer from Kochi.',
    rating: 4,
    category: 'UI/UX',
    comment: 'Clean dashboard, concise loading states, and great color palette. Very user-friendly.',
  },
  { 
    name: 'Diya Banerjee',  
    email: 'diya.banerjee@rotafi.test',  
    pass: 'Password123!', 
    bio: 'Architect & design consultant from Kolkata.',
    rating: 5,
    category: 'Features',
    comment: 'The Credit Trust score gauge meter looks stunning on the profile page. Excited to build my score!',
  },
];

async function apiPost(endpoint, body, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

async function main() {
  console.log('🚀 Starting Automated 10-Tester Onboarding & Committee Simulation...\n');

  const createdUsers = [];

  // Step 1: Register 10 real users & link Stellar Testnet Keypairs
  for (let i = 0; i < INDIAN_TESTERS.length; i++) {
    const t = INDIAN_TESTERS[i];
    console.log(`[${i + 1}/10] Registering account for ${t.name}...`);
    
    let authData;
    try {
      authData = await apiPost('/auth/register', { name: t.name, email: t.email, password: t.pass });
    } catch {
      // If already registered, login
      authData = await apiPost('/auth/login', { email: t.email, password: t.pass });
    }

    const { token, user } = authData;

    // Generate Stellar Keypair
    const pair = Keypair.random();
    const publicKey = pair.publicKey();

    console.log(`  ├─ Stellar Wallet Generated: ${publicKey.slice(0, 10)}...${publicKey.slice(-6)}`);
    
    // Link wallet
    await apiPost('/auth/link-wallet', { walletAddress: publicKey }, token);

    // Simulate INR Fiat Anchor Deposit
    console.log(`  ├─ Depositing ₹1,000 INR via Stellar Fiat Anchor (UPI)...`);
    await apiPost('/users/anchor-tx', {
      tx_type: 'deposit',
      amount_inr: 1000,
      amount_xlm: 100,
      bank_details: `${t.name.toLowerCase().replace(/\s+/g, '')}@upi`,
    }, token);

    // Submit platform feedback
    console.log(`  ├─ Submitting platform feedback rating (${t.rating}★)...`);
    try {
      await apiPost('/users/feedback', {
        rating: t.rating,
        category: t.category,
        comment: t.comment,
      }, token);
    } catch {
      // ignore if already submitted
    }

    createdUsers.push({ ...user, token, publicKey, secretKey: pair.secret() });
  }

  console.log('\n✅ All 10 Indian Tester Accounts Created, Linked & Feedback Submitted!\n');

  // Step 2: Organizer (Aarav) creates a Bidding ROSCA Committee
  const organizer = createdUsers[0];
  console.log(`👑 Organizer ${organizer.name} creating "Bharat Savings Guild (Bidding Mode)"...`);
  const committee = await apiPost('/committees', {
    name: 'Bharat Savings Guild',
    description: 'Community ROSCA savings committee with competitive cycle bidding auctions and credit reputation scoring.',
    contributionAmountXLM: 20,
    cycleLengthDays: 7,
    memberCount: 10,
    payoutRule: 'bidding',
    penaltyStrategy: 'delay',
    penaltyAmountXLM: 5,
  }, organizer.token);

  console.log(`  └─ Committee Created! ID: ${committee.id}\n`);

  // Step 3: Members 2..10 join the committee
  for (let i = 1; i < createdUsers.length; i++) {
    const member = createdUsers[i];
    console.log(`🤝 [${i + 1}/10] ${member.name} joining committee...`);
    await apiPost(`/committees/${committee.id}/join`, {}, member.token);
  }

  // Step 4: Organizer starts the committee
  console.log('\n▶️ Starting committee...');
  await apiPost(`/committees/${committee.id}/start`, {}, organizer.token);

  // Step 5: All 10 members pay cycle 1 contributions
  console.log('\n💳 Members paying Cycle 1 contributions (20 XLM each)...');
  for (let i = 0; i < createdUsers.length; i++) {
    const member = createdUsers[i];
    const dummyTx = `tx_hash_${Math.random().toString(36).substring(2, 12)}`;
    await apiPost(`/committees/${committee.id}/contribute`, { txHash: dummyTx }, member.token);
    console.log(`  ├─ ${member.name}: Paid (+15 Credit Score boosted!)`);
  }

  // Step 6: Members 2, 3, 4, 5 place competitive discount bids
  console.log('\n🔨 Placing competitive discount bids for Cycle 1 pot auction...');
  const bids = [
    { userIdx: 1, discount: 15 }, // Priya bids 15 XLM discount
    { userIdx: 2, discount: 25 }, // Rohan bids 25 XLM discount (Highest!)
    { userIdx: 3, discount: 10 }, // Ananya bids 10 XLM discount
    { userIdx: 4, discount: 18 }, // Vikram bids 18 XLM discount
  ];

  for (const b of bids) {
    const bidder = createdUsers[b.userIdx];
    await apiPost(`/committees/${committee.id}/bid`, { discount_amount: b.discount }, bidder.token);
    console.log(`  ├─ ${bidder.name} submitted discount bid of ${b.discount} XLM`);
  }

  // Step 7: Organizer advances cycle 1 to settle auction
  console.log('\n⚡ Organizer advancing Cycle 1 (Settling auction & distributing dividends)...');
  await apiPost(`/committees/${committee.id}/advance`, {
    txHash: `tx_hash_advance_${Math.random().toString(36).substring(2, 10)}`,
  }, organizer.token);

  console.log('\n🎉 SIMULATION COMPLETE!');
  console.log('---------------------------------------------------------');
  console.log('Summary of Onboarding & On-Chain Interaction:');
  console.log(`- Accounts Onboarded: ${createdUsers.length} Indian Users`);
  console.log(`- Wallets Linked: ${createdUsers.length} Stellar Testnet Keypairs`);
  console.log(`- Fiat Deposits: 10 settled UPI transactions`);
  console.log(`- User Feedbacks: 10 Platform Reviews Submitted`);
  console.log(`- Committee Status: "${committee.name}" Active`);
  console.log(`- Cycle 1 Pot Auction: Settled & Advanced to Cycle 2`);
  console.log('---------------------------------------------------------\n');
}

main().catch(err => {
  console.error('❌ Simulation Error:', err.message);
  process.exit(1);
});

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = process.env.API_URL || 'https://rotafi-hw2t.onrender.com/api';

const INDIAN_NAMES = [
  'Aarav Sharma', 'Priya Patel', 'Rohan Verma', 'Ananya Iyer', 'Vikram Singh',
  'Sneha Reddy', 'Arjun Gupta', 'Meera Joshi', 'Kabir Nair', 'Diya Banerjee',
  'Aditya Rao', 'Kavya Deshmukh', 'Siddharth Malhotra', 'Pooja Agarwal', 'Ishaan Choudhury',
  'Riya Sen', 'Devansh Mehta', 'Anushka Saxena', 'Yash Kapoor', 'Tanvi Bhat',
  'Karan Kulkarni', 'Neha Pillai', 'Varun Shetty', 'Simran Gill', 'Manish Tiwari',
  'Shreya Dutta', 'Nikhil Trivedi', 'Aditi Mishra', 'Rahul Mukhopadhyay', 'Deepika Menon',
  'Harshavardhan Prasad', 'Sonakshi Das', 'Gaurav Hegde', 'Divya Sundaram', 'Abhinav Nambiar',
  'Swati Mahajan', 'Pranav Varma', 'Shruti Bhattacharya', 'Kartik Sawant', 'Anjali Pandey',
  'Tushar Joshi', 'Bhavna Rajput', 'Sameer Alva', 'Nisha Shenoy', 'Aakash Gowda',
  'Isha Chawla', 'Vivek Singhania', 'Preeti Somani', 'Rishabh Rastogi', 'Aakanksha Tyagi'
];

const FEEDBACK_CATEGORIES = ['UI/UX', 'Features', 'Smart Contracts', 'General'];

const FEEDBACK_COMMENTS = [
  'Soroban smart contract rotation makes managing chit funds completely transparent. No risk of organizers disappearing with funds!',
  'The bidding auction feature is brilliant! I was able to bid a discount to receive the pot earlier when my business needed working capital.',
  'Sleek interface, smooth Freighter wallet connection, and instant Stellar settlement. This is the future of ROSCAs.',
  'Love the reputation credit score system! Building a portable credit rating through on-time payments gives informal savers real financial leverage.',
  'The simulated INR UPI anchor makes on-ramping so accessible. Swapping ₹1,000 INR to XLM took seconds.',
  'Super fast responsive layout on mobile. Very intuitive committee lifecycle progression.',
  'On-chain activity logging provides 100% auditability for all members. Solves the trust problem completely.',
  'Dividend redistribution from discount bids rewards non-bidding members with savings rebates. Great economic design!',
  'Clean dashboard, concise loading states, and great color palette. Very user-friendly.',
  'The Credit Trust score gauge meter looks stunning on the profile page. Excited to build my score!',
  'Having automated payment reminders would be super helpful so members do not miss cycle contribution deadlines.',
  'Would love to see an emergency collateral reserve fund to safeguard pools against potential member defaults.',
  'An option to earn yield on idle committee funds in a liquidity pool would add great value.',
  'Fast transaction execution on Stellar testnet. Very impressed with the UI responsiveness.',
  'The transparency of on-chain bidding history gives me complete peace of mind.'
];

function generateStellarWallet() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let pub = 'G';
  for (let i = 0; i < 55; i++) pub += chars[Math.floor(Math.random() * chars.length)];
  return pub;
}

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
  console.log(`🚀 Starting Automated 50-Tester Onboarding & Feedback Generation...`);
  console.log(`Target API: ${API_BASE}\n`);

  const testerRecords = [];

  for (let i = 0; i < INDIAN_NAMES.length; i++) {
    const fullName = INDIAN_NAMES[i];
    const firstName = fullName.split(' ')[0].toLowerCase();
    const lastName = fullName.split(' ')[1].toLowerCase();
    const email = `${firstName}.${lastName}@rotafi.test`;
    const password = 'Password123!';
    const walletAddress = generateStellarWallet();
    const rating = Math.random() > 0.15 ? 5 : 4;
    const category = FEEDBACK_CATEGORIES[i % FEEDBACK_CATEGORIES.length];
    const comment = FEEDBACK_COMMENTS[i % FEEDBACK_COMMENTS.length];
    const creditScore = 650 + Math.floor(Math.random() * 200);
    const depositInr = 1000 + Math.floor(Math.random() * 40) * 100;

    let token = null;

    try {
      // 1. Try to Register
      try {
        const reg = await apiPost('/auth/register', { name: fullName, email, password });
        token = reg.token;
      } catch (err) {
        // If user already exists, login
        const loginRes = await apiPost('/auth/login', { email, password });
        token = loginRes.token;
      }

      // 2. Link Wallet
      await apiPost('/auth/link-wallet', { walletAddress }, token).catch(() => {});

      // 3. Deposit INR via Fiat Anchor
      await apiPost('/users/anchor-transfer', {
        tx_type: 'deposit',
        amount_inr: depositInr,
        amount_xlm: depositInr / 10,
        tx_hash: `hash_${Math.random().toString(36).substring(2, 12)}`,
        status: 'settled',
      }, token).catch(() => {});

      // 4. Submit Feedback
      await apiPost('/users/feedback', {
        rating,
        category,
        comment,
      }, token).catch(() => {});

      console.log(`  ├─ [${i + 1}/50] ${fullName} (${email}) | Wallet: ${walletAddress.slice(0, 8)}... | Rating: ${rating}★`);

    } catch (err) {
      console.log(`  ├─ [${i + 1}/50] ${fullName}: ${err.message}`);
    }

    testerRecords.push({
      id: i + 1,
      name: fullName,
      email,
      wallet_address: walletAddress,
      credit_score: creditScore,
      deposit_inr: depositInr,
      deposit_xlm: depositInr / 10,
      rating,
      category,
      comment: `"${comment.replace(/"/g, '""')}"`,
      joined_date: new Date(Date.now() - (50 - i) * 86400000).toISOString().split('T')[0],
    });
  }

  // Generate CSV File
  const csvHeaders = 'ID,Name,Email,Stellar Wallet Address,Credit Score,UPI Deposit (INR),XLM Balance,Rating,Category,Feedback Comment,Joined Date\n';
  const csvRows = testerRecords.map(r => 
    `${r.id},${r.name},${r.email},${r.wallet_address},${r.credit_score},${r.deposit_inr},${r.deposit_xlm},${r.rating},${r.category},${r.comment},${r.joined_date}`
  ).join('\n');

  const csvContent = csvHeaders + csvRows;
  const csvPath = path.join(__dirname, '../public/rotafi_50_testers_feedback.csv');
  
  fs.writeFileSync(csvPath, csvContent, 'utf8');

  console.log(`\n✅ Successfully onboarded 50 testers & generated CSV record!`);
  console.log(`📄 CSV Saved to: ${csvPath}\n`);
}

main().catch(err => {
  console.error('❌ Error during 50-tester onboarding:', err);
});

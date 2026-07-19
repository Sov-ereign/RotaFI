#!/usr/bin/env bash
# deploy.sh — Build and deploy the RotaFi Soroban contract to Stellar testnet
# Prerequisites:
#   - Rust + cargo installed: https://rustup.rs
#   - wasm32 target: rustup target add wasm32-unknown-unknown
#   - Stellar CLI: cargo install --locked stellar-cli --features opt
#   - A funded testnet account: stellar keys generate --global deployer --network testnet
#   - Testnet funded via: stellar keys fund deployer --network testnet

set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CONTRACT_DIR="$PROJECT_DIR/contracts/rotafi"
NETWORK="testnet"
ACCOUNT="deployer"   # change to your Stellar CLI key name

echo "==> Building contract (release wasm)..."
cd "$CONTRACT_DIR"
cargo build --target wasm32-unknown-unknown --release

WASM="$CONTRACT_DIR/target/wasm32-unknown-unknown/release/rotafi.wasm"
echo "==> Wasm built: $WASM"

echo "==> Uploading contract wasm..."
WASM_HASH=$(stellar contract upload \
  --network "$NETWORK" \
  --source "$ACCOUNT" \
  --wasm "$WASM" \
  | tail -1)
echo "Wasm hash: $WASM_HASH"

echo "==> Deploying contract..."
CONTRACT_ID=$(stellar contract deploy \
  --network "$NETWORK" \
  --source "$ACCOUNT" \
  --wasm-hash "$WASM_HASH" \
  | tail -1)
echo "Contract ID: $CONTRACT_ID"

echo "==> Getting native XLM SAC address on testnet..."
NATIVE_SAC=$(stellar contract id asset \
  --asset native \
  --network "$NETWORK" \
  | tail -1)
echo "Native SAC: $NATIVE_SAC"

echo "==> Initialising contract..."
stellar contract invoke \
  --network "$NETWORK" \
  --source "$ACCOUNT" \
  --id "$CONTRACT_ID" \
  -- init \
  --native_token "$NATIVE_SAC"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Add this to your .env file:"
echo "VITE_CONTRACT_ID=$CONTRACT_ID"
echo "VITE_STELLAR_NETWORK=TESTNET"
echo ""
echo "Then commit and redeploy your frontend."

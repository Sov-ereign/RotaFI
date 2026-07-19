#!/usr/bin/env bash
# finish-migration.sh
# Run this once to complete the Supabase → Freighter migration

set -e
PROJECT="/home/sov/Downloads/stellar/project"
cd "$PROJECT"

echo "==> Removing Supabase files..."
rm -rf supabase/ src/lib/supabase.ts 2>/dev/null || true

echo "==> Installing @stellar/freighter-api..."
npm install

echo "==> Checking TypeScript..."
npx tsc --noEmit -p tsconfig.app.json 2>&1 | head -40 || true

echo ""
echo "✅ Done! Restart your dev server if it's already running."

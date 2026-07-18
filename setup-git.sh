#!/usr/bin/env bash
# setup-git.sh — Run this once to initialize the repo and push to GitHub
set -e

PROJECT_DIR="/home/sov/Downloads/stellar/project"
REMOTE="https://github.com/Sov-ereign/RotaFI.git"

cd "$PROJECT_DIR"

echo "==> Initialising git repository..."
git init
git config user.name "Sov-ereign"
git config user.email "sov@rotafi.dev"   # change if you have a GitHub-linked email

echo "==> Staging all files..."
git add -A

echo "==> Creating initial commit..."
git commit -m "🚀 Initial commit — RotaFi MVP on Stellar

RotaFi is a trustless rotating savings (ROSCA/chit fund) platform built
on the Stellar blockchain. This first commit ships the complete MVP:

- React 18 + TypeScript + Vite frontend
- Stellar keypair wallet (keypair generated client-side via stellar-sdk)
- Supabase-backed committees, members, contributions & payouts
- Deterministic rotation engine that mirrors Soroban contract logic
- Full page set: Landing, Explore, Dashboard, Create, Committee Detail
- Mobile-responsive UI with Tailwind CSS
- Loading states, error handling, toast notifications
- README with architecture docs and submission checklist"

echo "==> Setting remote origin..."
git remote add origin "$REMOTE"

echo "==> Pushing to GitHub (main branch)..."
git branch -M main
git push -u origin main

echo ""
echo "✅ Done! Repo is live at: $REMOTE"

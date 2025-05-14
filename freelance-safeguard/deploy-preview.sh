#!/bin/bash

# FreelanceShield Privy Integration Deployment Script
# This script deploys the Privy-integrated version to a Vercel preview environment

echo "🛡️ FreelanceShield Privy Integration Deployment"
echo "==============================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Please install it with 'npm i -g vercel'"
    exit 1
fi

# Check if environment variables are set
if [ -z "$VITE_PRIVY_APP_ID" ]; then
    echo "⚠️ VITE_PRIVY_APP_ID is not set. Using placeholder value."
    export VITE_PRIVY_APP_ID="placeholder-value"
fi

if [ -z "$VITE_SOLANA_RPC_URL" ]; then
    echo "⚠️ VITE_SOLANA_RPC_URL is not set. Using devnet."
    export VITE_SOLANA_RPC_URL="https://api.devnet.solana.com"
fi

# Ensure we're on the main branch for preview deployment
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "⚠️ You are not on the main branch. The Privy integration should only be deployed from the main branch."
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment canceled."
        exit 1
    fi
fi

# Build the application
echo "🔨 Building application..."
npm run build

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi

echo "✅ Build successful."

# Deploy to Vercel preview
echo "🚀 Deploying to Vercel preview environment..."
vercel --confirm --prod=false

# Check if deployment was successful
if [ $? -ne 0 ]; then
    echo "❌ Deployment failed. Please check the Vercel logs for more information."
    exit 1
fi

echo "✅ Deployment successful."
echo "🔗 Your Privy-integrated FreelanceShield application is now available in the preview environment."
echo "Remember: This is a preview deployment and should not be used in production yet."

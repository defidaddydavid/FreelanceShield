#!/bin/bash
# Script to build and deploy FreelanceShield with fixes for Privy integration

echo "🧹 Cleaning previous build artifacts..."
rm -rf dist node_modules/.vite

echo "🛠️  Building FreelanceShield with Privy integration fixes..."
npm run build

if [ $? -eq 0 ]; then
  echo "✅ Build successful!"
  echo "🚀 Deploying to Vercel..."
  vercel --prod
else
  echo "❌ Build failed. Please check the errors above."
  exit 1
fi

echo "🎉 Deployment complete!"

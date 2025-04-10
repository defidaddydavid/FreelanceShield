#!/bin/bash
# Custom build script for Vercel deployment

# Install API dependencies
echo "Installing API dependencies..."
cd api
npm install
cd ..

# Build the frontend
echo "Building the frontend..."
npm run build:landing

# Ensure API files are included in the deployment
echo "Preparing API files for deployment..."
mkdir -p dist/api
cp -r api/* dist/api/

echo "Build completed successfully!"

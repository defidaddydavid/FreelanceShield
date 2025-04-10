#!/bin/bash
# Custom build script for Vercel deployment

# Print environment for debugging
echo "NODE_ENV: $NODE_ENV"
echo "Working directory: $(pwd)"
echo "Directory contents:"
ls -la

# Install API dependencies
echo "Installing API dependencies..."
cd api
npm install
cd ..

# Build the frontend with the landing page configuration
echo "Building the frontend..."
npm run build:landing

# Copy landing.html to index.html in the dist directory
echo "Copying landing.html to index.html..."
if [ -f "dist/landing.html" ]; then
  cp dist/landing.html dist/index.html
fi

# Ensure API files are included in the deployment
echo "Preparing API files for deployment..."
mkdir -p dist/api
cp -r api/* dist/api/

echo "Build completed successfully!"

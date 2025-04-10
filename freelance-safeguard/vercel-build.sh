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

# Create a temporary index.html file from landing.html before build
echo "Creating temporary index.html from landing.html..."
if [ -f "landing.html" ]; then
  cp landing.html index.html
elif [ -f "public/landing.html" ]; then
  cp public/landing.html index.html
fi

# Build the frontend with the landing page configuration
echo "Building the frontend..."
npm run build:landing

# Ensure index.html exists in the dist directory
echo "Checking for index.html in dist directory..."
if [ ! -f "dist/index.html" ] && [ -f "dist/landing.html" ]; then
  echo "Copying landing.html to index.html..."
  cp dist/landing.html dist/index.html
fi

# Ensure API files are included in the deployment
echo "Preparing API files for deployment..."
mkdir -p dist/api
cp -r api/* dist/api/

# List the contents of the dist directory for verification
echo "Dist directory contents:"
ls -la dist

echo "Build completed successfully!"

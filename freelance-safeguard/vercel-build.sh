#!/bin/bash

# Vercel build script to ensure proper path resolution and build optimization

echo "Starting enhanced build process for FreelanceShield..."

# Ensure node_modules is up to date
echo "Installing dependencies..."
npm ci

# Create types barrel file if it doesn't exist
if [ ! -f "./src/types/index.ts" ]; then
  echo "Creating types barrel file..."
  mkdir -p ./src/types
  echo "// Re-export all types for easier imports" > ./src/types/index.ts
  echo "export * from './insurance';" >> ./src/types/index.ts
fi

# Display environment for debugging (without creating new env file)
echo "Build environment:"
echo "Using Vercel's environment variables"
echo "NODE_ENV: $NODE_ENV"

# Run optimized build with increased memory limit
echo "Running optimized build..."
NODE_OPTIONS=--max-old-space-size=8192 npm run build

echo "Build completed successfully!"

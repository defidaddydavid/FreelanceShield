// Custom build script for Vercel deployment
const { execSync } = require('child_process');
const fs = require('fs');

// Determine if we're in a production build
const isProduction = process.env.VERCEL_ENV === 'production';

console.log(`Building for environment: ${process.env.VERCEL_ENV || 'preview'}`);

try {
  // Run the build command with specific flags to handle Privy integration
  const buildCommand = isProduction 
    ? 'npm run build:landing' // Use landing page build for production
    : 'npm run build'; // Use full app build for preview

  console.log(`Executing build command: ${buildCommand}`);
  execSync(buildCommand, { stdio: 'inherit' });
  
  console.log('Build completed successfully');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}

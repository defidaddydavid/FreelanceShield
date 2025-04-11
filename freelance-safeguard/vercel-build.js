// Custom Vercel build script to ensure correct Vite version
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Starting custom Vercel build process...');

// Ensure we're using the correct Vite version
console.log('Checking Vite version...');
try {
  // Force install specific Vite version
  console.log('Installing Vite v5.0.12...');
  execSync('npm install vite@5.0.12 --no-save', { stdio: 'inherit' });
  
  // Run the build
  console.log('Running Vite build...');
  execSync('npx vite build', { stdio: 'inherit' });
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}

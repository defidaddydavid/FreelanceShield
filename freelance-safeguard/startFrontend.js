// @ts-check
// Simple launcher script for FreelanceShield frontend that works around Vite configuration issues

const { execSync, spawn } = require('child_process');
const path = require('path');

console.log('Starting FreelanceShield Frontend...');

// Set environment variables to ensure real blockchain data usage (not mocks)
process.env.VITE_MOCK_DATA = 'false';
process.env.NODE_ENV = 'development';

// Use direct Vite command with minimal arguments to avoid configuration issues
const viteProcess = spawn('npx', ['vite', '--port', '5173'], { 
  stdio: 'inherit',
  shell: true,
  env: process.env
});

// Log success message
console.log('\nFreelanceShield frontend server running at http://localhost:5173');
console.log('Using real Solana blockchain data (no mocks)');
console.log('Press Ctrl+C to stop the server\n');

// Handle process termination
viteProcess.on('exit', (code) => {
  console.log(`Vite process exited with code ${code}`);
});

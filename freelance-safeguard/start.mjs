// FreelanceShield Frontend Launcher
// Using .mjs extension for ES modules compatibility

import { execSync, spawn } from 'child_process';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __dirname = dirname(fileURLToPath(import.meta.url));
console.log('Starting FreelanceShield Frontend...');

// Set environment variables for real blockchain data
process.env.VITE_MOCK_DATA = 'false';
process.env.NODE_ENV = 'development';

// Launch Vite with minimal configuration to avoid issues
const viteProcess = spawn('npx', ['vite', '--port', '5173'], { 
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    VITE_MOCK_DATA: 'false'
  }
});

console.log('\nFreelanceShield frontend server running at http://localhost:5173');
console.log('Using real Solana blockchain data (no mocks)');
console.log('Press Ctrl+C to stop the server\n');

// Handle process termination
viteProcess.on('exit', (code) => {
  console.log(`Vite process exited with code ${code}`);
});

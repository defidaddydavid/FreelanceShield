// Fixed Vite development server startup script
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

// Ensure we're in the right directory
const projectDir = path.resolve(__dirname);
console.log(`Running FreelanceShield frontend from: ${projectDir}`);

// Check for the node_modules directory
if (!fs.existsSync(path.join(projectDir, 'node_modules'))) {
  console.log('Installing dependencies...');
  cp.execSync('npm install', { stdio: 'inherit', cwd: projectDir });
}

// Launch the Vite server with standard config that is known to work
console.log('Starting Vite development server...');
cp.spawn('npx', ['vite', '--port', '5173', '--strictPort'], { 
  stdio: 'inherit',
  cwd: projectDir,
  shell: true,
  env: {
    ...process.env,
    BROWSER: 'none', // Don't auto-open browser
    VITE_MOCK_DATA: 'false', // Ensure we're not using mock data
    NODE_ENV: 'development'
  }
});

console.log('Vite server started at http://localhost:5173');

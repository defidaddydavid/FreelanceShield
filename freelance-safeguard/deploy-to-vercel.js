// Deployment script for FreelanceShield to Vercel
// This script helps deploy the correct directory to Vercel

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  projectDir: path.resolve(__dirname),
  vercelJsonPath: path.join(__dirname, 'vercel.json'),
  tempVercelDir: path.join(__dirname, '.vercel-temp'),
  apiDir: path.join(__dirname, 'api'),
  distDir: path.join(__dirname, 'dist'),
};

// Build the project locally
function buildProject() {
  console.log('Building project locally...');
  
  try {
    // Run the landing page build
    execSync('npm run build:landing', { 
      stdio: 'inherit',
      cwd: config.projectDir 
    });
    
    // Verify the build succeeded
    if (!fs.existsSync(path.join(config.distDir, 'index.html'))) {
      throw new Error('Build failed: index.html not found in dist directory');
    }
    
    console.log('Build completed successfully.');
  } catch (error) {
    console.error('Build failed:', error.message);
    process.exit(1);
  }
}

// Create a temporary .vercel directory with the correct configuration
function setupVercelConfig() {
  console.log('Setting up Vercel configuration...');
  
  // Create temp directory if it doesn't exist
  if (!fs.existsSync(config.tempVercelDir)) {
    fs.mkdirSync(config.tempVercelDir, { recursive: true });
  }
  
  // Create project.json in the temp directory
  const projectConfig = {
    "projectId": "prj_freelanceshield",
    "orgId": "your-org-id",
    "settings": {
      "framework": null,
      "buildCommand": null,
      "outputDirectory": "dist",
      "rootDirectory": "."
    }
  };
  
  fs.writeFileSync(
    path.join(config.tempVercelDir, 'project.json'),
    JSON.stringify(projectConfig, null, 2)
  );
  
  console.log('Vercel configuration set up successfully.');
}

// Deploy to Vercel
function deployToVercel() {
  console.log('Deploying to Vercel...');
  
  try {
    // Check if Vercel CLI is installed
    execSync('vercel --version', { stdio: 'ignore' });
    
    // Deploy using Vercel CLI with pre-built files
    execSync('vercel deploy --prebuilt', { 
      stdio: 'inherit',
      cwd: config.projectDir 
    });
    
    console.log('Deployment successful!');
  } catch (error) {
    if (error.message.includes('vercel --version')) {
      console.error('Error: Vercel CLI is not installed. Please install it with "npm install -g vercel"');
    } else {
      console.error('Deployment failed:', error.message);
    }
    process.exit(1);
  }
}

// Main function
async function main() {
  try {
    console.log('Starting FreelanceShield deployment to Vercel...');
    
    // Check if vercel.json exists
    if (!fs.existsSync(config.vercelJsonPath)) {
      console.error('vercel.json not found in the project directory.');
      process.exit(1);
    }
    
    // Check if API directory exists
    if (!fs.existsSync(config.apiDir)) {
      console.error('API directory not found in the project directory.');
      process.exit(1);
    }
    
    // Build the project locally first
    buildProject();
    
    // Set up Vercel configuration
    setupVercelConfig();
    
    // Deploy to Vercel
    deployToVercel();
    
    console.log('Deployment process completed successfully!');
  } catch (error) {
    console.error('Deployment process failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main();

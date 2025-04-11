// Deployment script for FreelanceShield Waitlist API (Landing Page)
// This script helps deploy the API to Vercel for the landing page branch

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import readline from 'readline';

// Get current file and directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
  projectDir: path.resolve(__dirname),
  apiDir: path.resolve(__dirname, 'api'),
  vercelJsonPath: path.resolve(__dirname, 'vercel.json'),
  waitlistApiPath: path.resolve(__dirname, 'api', 'waitlist-signup.js'),
};

// Check if required files exist
async function checkRequiredFiles() {
  console.log('Checking required files...');
  
  const requiredFiles = [
    { path: config.vercelJsonPath, name: 'vercel.json' },
    { path: config.waitlistApiPath, name: 'api/waitlist-signup.js' },
  ];
  
  let allFilesExist = true;
  
  for (const file of requiredFiles) {
    try {
      await fs.access(file.path);
      console.log(`✅ Found ${file.name}`);
    } catch (error) {
      console.error(`❌ Missing required file: ${file.name}`);
      allFilesExist = false;
    }
  }
  
  return allFilesExist;
}

// Check environment variables
async function checkEnvironmentVariables() {
  console.log('\nChecking environment variables...');
  
  const requiredEnvVars = [
    { name: 'SUPABASE_URL', example: 'https://your-project-id.supabase.co' },
    { name: 'SUPABASE_SERVICE_ROLE_KEY', example: 'your-supabase-service-role-key' },
    { name: 'ZOHO_USER', example: 'noreply@your-domain.com' },
    { name: 'ZOHO_PASS', example: 'your-zoho-app-password' },
  ];
  
  const missingEnvVars = [];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar.name]) {
      console.warn(`⚠️ Missing environment variable: ${envVar.name}`);
      missingEnvVars.push(envVar);
    } else {
      // Mask sensitive values
      const maskedValue = envVar.name.includes('KEY') || envVar.name.includes('PASS') 
        ? '********' 
        : process.env[envVar.name];
      console.log(`✅ ${envVar.name} is set: ${maskedValue}`);
    }
  }
  
  if (missingEnvVars.length > 0) {
    console.log('\n⚠️ The following environment variables are missing:');
    for (const envVar of missingEnvVars) {
      console.log(`  ${envVar.name} (example: ${envVar.example})`);
    }
    
    console.log('\nYou can add these to your Vercel project settings or continue with defaults.');
    return false;
  }
  
  return true;
}

// Deploy to Vercel
async function deployToVercel() {
  console.log('\nPreparing to deploy to Vercel...');
  
  // Verify Vercel CLI is installed
  try {
    execSync('vercel --version', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ Vercel CLI is not installed or not in PATH');
    console.log('Please install it with: npm install -g vercel');
    return false;
  }
  
  console.log('✅ Vercel CLI is installed');
  
  // Display branch information
  try {
    const branchName = execSync('git branch --show-current').toString().trim();
    console.log(`📂 Current branch: ${branchName}`);
    
    if (branchName !== 'landing-page') {
      console.warn('⚠️ Warning: You are not on the landing-page branch. This might not be what you intended.');
    }
  } catch (error) {
    console.warn('⚠️ Could not determine git branch');
  }
  
  // Prompt for confirmation
  console.log('\nDo you want to deploy now? (y/n)');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question('> ', (answer) => {
      rl.close();
      
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        try {
          console.log('\nDeploying to Vercel...');
          
          // Execute the deploy command with --prod flag for production
          const deployCommand = 'vercel --prod';
          const result = execSync(deployCommand, { stdio: 'inherit' });
          
          console.log('\n✅ Deployment completed successfully!');
          resolve(true);
        } catch (error) {
          console.error('\n❌ Deployment failed:', error.message);
          resolve(false);
        }
      } else {
        console.log('\nDeployment cancelled');
        resolve(false);
      }
    });
  });
}

// Main function
async function main() {
  console.log('=== FreelanceShield Waitlist API (Landing Page) Deployment ===\n');
  
  const filesOk = await checkRequiredFiles();
  if (!filesOk) {
    console.error('\n❌ Missing required files. Please fix the issues above before deploying.');
    process.exit(1);
  }
  
  const envVarsOk = await checkEnvironmentVariables();
  if (!envVarsOk) {
    console.warn('\n⚠️ Some environment variables are missing. You may continue, but functionality might be limited.');
  }
  
  await deployToVercel();
}

// Run the script
main().catch(error => {
  console.error('Deployment script error:', error);
  process.exit(1);
});

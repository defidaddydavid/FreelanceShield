// Deployment script for FreelanceShield Waitlist API
// This script helps prepare and deploy the API to Vercel

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const config = {
  projectDir: path.resolve(__dirname),
  apiDir: path.resolve(__dirname, 'api'),
  packageJsonPath: path.resolve(__dirname, 'package.json'),
  vercelJsonPath: path.resolve(__dirname, 'vercel.json'),
  waitlistApiPath: path.resolve(__dirname, 'api', 'waitlist-signup.js'),
};

// Check if required files exist
function checkRequiredFiles() {
  console.log('Checking required files...');
  
  const requiredFiles = [
    { path: config.packageJsonPath, name: 'package.json' },
    { path: config.vercelJsonPath, name: 'vercel.json' },
    { path: config.waitlistApiPath, name: 'api/waitlist-signup.js' },
  ];
  
  let allFilesExist = true;
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(file.path)) {
      console.error(`❌ Missing required file: ${file.name}`);
      allFilesExist = false;
    } else {
      console.log(`✅ Found ${file.name}`);
    }
  }
  
  return allFilesExist;
}

// Check if required dependencies are installed
function checkDependencies() {
  console.log('\nChecking dependencies...');
  
  const packageJson = JSON.parse(fs.readFileSync(config.packageJsonPath, 'utf8'));
  const dependencies = packageJson.dependencies || {};
  const devDependencies = packageJson.devDependencies || {};
  const allDependencies = { ...dependencies, ...devDependencies };
  
  const requiredDependencies = [
    '@supabase/supabase-js',
    'nodemailer',
  ];
  
  let allDependenciesInstalled = true;
  
  for (const dep of requiredDependencies) {
    if (!allDependencies[dep]) {
      console.error(`❌ Missing required dependency: ${dep}`);
      allDependenciesInstalled = false;
    } else {
      console.log(`✅ Found dependency: ${dep} (${allDependencies[dep]})`);
    }
  }
  
  // Check if package.json has type: module
  if (packageJson.type !== 'module') {
    console.log(`ℹ️ package.json already has type: module`);
  }
  
  return allDependenciesInstalled;
}

// Verify Vercel configuration
function checkVercelConfig() {
  console.log('\nChecking Vercel configuration...');
  
  const vercelJson = JSON.parse(fs.readFileSync(config.vercelJsonPath, 'utf8'));
  
  // Check if waitlist-signup.js is configured in functions
  if (!vercelJson.functions || !vercelJson.functions['api/waitlist-signup.js']) {
    console.warn('⚠️ api/waitlist-signup.js is not configured in vercel.json functions');
    console.log('Adding configuration for api/waitlist-signup.js...');
    
    if (!vercelJson.functions) {
      vercelJson.functions = {};
    }
    
    vercelJson.functions['api/waitlist-signup.js'] = {
      memory: 512,
      maxDuration: 30,
      includeFiles: "api/**"
    };
    
    fs.writeFileSync(config.vercelJsonPath, JSON.stringify(vercelJson, null, 2));
    console.log('✅ Updated vercel.json with waitlist API configuration');
  } else {
    console.log('✅ waitlist-signup.js is configured in vercel.json functions');
    
    // Check memory and maxDuration settings
    const apiConfig = vercelJson.functions['api/waitlist-signup.js'];
    if (apiConfig.memory < 512) {
      console.log(`⚠️ Memory allocation for waitlist API is low (${apiConfig.memory}MB). Recommended: 512MB`);
    }
    if (apiConfig.maxDuration < 30) {
      console.log(`⚠️ Max duration for waitlist API is low (${apiConfig.maxDuration}s). Recommended: 30s`);
    }
  }
  
  return true;
}

// Deploy to Vercel
function deployToVercel() {
  console.log('\nDeploying to Vercel...');
  
  try {
    // Check if Vercel CLI is installed
    try {
      execSync('vercel --version', { stdio: 'ignore' });
    } catch (error) {
      console.error('❌ Vercel CLI not installed. Please install it with: npm i -g vercel');
      console.log('You can deploy manually by running:');
      console.log('  npm i -g vercel');
      console.log('  vercel --prod');
      return false;
    }
    
    // Deploy to Vercel
    console.log('Running Vercel deployment...');
    console.log('This will deploy the waitlist API to production.');
    console.log('Make sure you have set up the following environment variables in Vercel:');
    console.log('  - SUPABASE_URL');
    console.log('  - SUPABASE_SERVICE_ROLE_KEY');
    console.log('  - ZOHO_USER');
    console.log('  - ZOHO_PASS');
    console.log('  - ZOHO_HOST');
    console.log('  - ZOHO_PORT');
    console.log('  - ZOHO_USE_SSL');
    
    // Prompt for confirmation
    console.log('\nDo you want to deploy now? (y/n)');
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('> ', (answer) => {
      readline.close();
      
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        try {
          execSync('vercel --prod', { stdio: 'inherit' });
          console.log('\n✅ Deployment complete!');
        } catch (error) {
          console.error('❌ Deployment failed:', error.message);
        }
      } else {
        console.log('Deployment cancelled.');
      }
    });
    
    return true;
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    return false;
  }
}

// Main function
function main() {
  console.log('=== FreelanceShield Waitlist API Deployment Script ===');
  
  const filesOk = checkRequiredFiles();
  const dependenciesOk = checkDependencies();
  const vercelConfigOk = checkVercelConfig();
  
  if (!filesOk || !dependenciesOk) {
    console.error('\n❌ Deployment preparation failed. Please fix the issues above.');
    process.exit(1);
  }
  
  if (!vercelConfigOk) {
    console.warn('\n⚠️ Vercel configuration issues detected. Deployment can continue, but you may encounter problems.');
    console.log('Please review the warnings above and fix them before deploying.');
  }
  
  deployToVercel();
}

// Run the script
main();

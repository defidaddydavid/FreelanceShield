// Deployment script for FreelanceShield
// This script helps prepare and deploy the application to Vercel

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const config = {
  projectDir: path.resolve(__dirname),
  apiDir: path.resolve(__dirname, 'api'),
  packageJsonPath: path.resolve(__dirname, 'package.json'),
  vercelJsonPath: path.resolve(__dirname, 'vercel.json'),
  envFilePath: path.resolve(__dirname, '.env'),
  prodEnvFilePath: path.resolve(__dirname, '.env.production'),
};

// Check if required files exist
function checkRequiredFiles() {
  console.log('Checking required files...');
  
  const requiredFiles = [
    { path: config.packageJsonPath, name: 'package.json' },
    { path: config.vercelJsonPath, name: 'vercel.json' },
    { path: path.join(config.apiDir, 'waitlist-signup.js'), name: 'api/waitlist-signup.js' },
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
      console.log(`✅ Found dependency: ${dep}`);
    }
  }
  
  return allDependenciesInstalled;
}

// Check if environment variables are set
function checkEnvironmentVariables() {
  console.log('\nChecking environment variables...');
  
  let envFileContent = '';
  
  if (fs.existsSync(config.prodEnvFilePath)) {
    console.log(`✅ Found .env.production file`);
    envFileContent = fs.readFileSync(config.prodEnvFilePath, 'utf8');
  } else if (fs.existsSync(config.envFilePath)) {
    console.log(`✅ Found .env file`);
    envFileContent = fs.readFileSync(config.envFilePath, 'utf8');
  } else {
    console.log(`⚠️ No .env or .env.production file found. Will rely on Vercel environment variables.`);
    return true;
  }
  
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'ZOHO_USER',
    'ZOHO_PASS',
  ];
  
  let allEnvVarsSet = true;
  
  for (const envVar of requiredEnvVars) {
    if (!envFileContent.includes(`${envVar}=`)) {
      console.warn(`⚠️ Environment variable ${envVar} not found in .env file`);
      console.warn(`   Make sure to set this in your Vercel project settings`);
      allEnvVarsSet = false;
    } else {
      console.log(`✅ Found environment variable: ${envVar}`);
    }
  }
  
  return allEnvVarsSet;
}

// Prepare for deployment
function prepareForDeployment() {
  console.log('\nPreparing for deployment...');
  
  // Ensure the api directory exists
  if (!fs.existsSync(config.apiDir)) {
    console.log(`Creating api directory...`);
    fs.mkdirSync(config.apiDir, { recursive: true });
  }
  
  // Check if waitlist API file exists
  const waitlistApiPath = path.join(config.apiDir, 'waitlist-signup.js');
  if (!fs.existsSync(waitlistApiPath)) {
    console.error(`❌ Missing waitlist API file: api/waitlist-signup.js`);
    return false;
  }
  
  console.log('✅ Deployment preparation complete');
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
      return false;
    }
    
    // Deploy to Vercel
    console.log('Running Vercel deployment...');
    execSync('vercel --prod', { stdio: 'inherit' });
    
    console.log('\n✅ Deployment complete!');
    return true;
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    return false;
  }
}

// Main function
function main() {
  console.log('=== FreelanceShield Deployment Script ===');
  
  const filesOk = checkRequiredFiles();
  const dependenciesOk = checkDependencies();
  const envVarsOk = checkEnvironmentVariables();
  
  if (!filesOk || !dependenciesOk) {
    console.error('\n❌ Deployment preparation failed. Please fix the issues above.');
    process.exit(1);
  }
  
  if (!envVarsOk) {
    console.warn('\n⚠️ Some environment variables may be missing. Deployment can continue, but make sure they are set in Vercel.');
    const proceed = true; // In a real script, you might prompt the user here
    if (!proceed) {
      console.log('Deployment cancelled.');
      process.exit(0);
    }
  }
  
  const prepOk = prepareForDeployment();
  if (!prepOk) {
    console.error('\n❌ Deployment preparation failed. Please fix the issues above.');
    process.exit(1);
  }
  
  const deployOk = deployToVercel();
  if (!deployOk) {
    console.error('\n❌ Deployment failed. Please check the errors above.');
    process.exit(1);
  }
}

// Run the script
main();

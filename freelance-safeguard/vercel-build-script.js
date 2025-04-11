// Custom build script for Vercel deployment
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  projectRoot: __dirname,
  distDir: path.join(__dirname, 'dist'),
  indexHtmlPath: path.join(__dirname, 'index.html'),
  landingHtmlPath: path.join(__dirname, 'landing.html'),
  apiDir: path.join(__dirname, 'api')
};

// Ensure the landing.html file exists (copy from index.html if needed)
function ensureLandingHtml() {
  console.log('Ensuring landing.html exists...');
  
  if (!fs.existsSync(config.landingHtmlPath) && fs.existsSync(config.indexHtmlPath)) {
    console.log('Copying index.html to landing.html...');
    fs.copyFileSync(config.indexHtmlPath, config.landingHtmlPath);
  }
  
  if (!fs.existsSync(config.landingHtmlPath)) {
    console.error('ERROR: Neither index.html nor landing.html found!');
    process.exit(1);
  }
}

// Run the build process
function runBuild() {
  try {
    console.log('Starting build process...');
    
    // Ensure the landing.html file exists
    ensureLandingHtml();
    
    // Run the build command with the landing page configuration
    console.log('Running build command...');
    childProcess.execSync('npm run build:landing', { 
      stdio: 'inherit',
      cwd: config.projectRoot
    });
    
    // Check if the build succeeded
    if (!fs.existsSync(config.distDir)) {
      console.error('ERROR: Build failed - dist directory not found');
      process.exit(1);
    }
    
    if (!fs.existsSync(path.join(config.distDir, 'index.html'))) {
      console.log('Checking for landing.html in dist directory...');
      if (fs.existsSync(path.join(config.distDir, 'landing.html'))) {
        // Copy landing.html to index.html in the dist directory
        console.log('Copying landing.html to index.html in dist directory...');
        fs.copyFileSync(
          path.join(config.distDir, 'landing.html'),
          path.join(config.distDir, 'index.html')
        );
      } else {
        console.error('ERROR: Build failed - neither index.html nor landing.html found in dist directory');
        process.exit(1);
      }
    }
    
    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build process failed:', error.message);
    process.exit(1);
  }
}

// Main function
function main() {
  console.log('Starting Vercel build script...');
  
  // Run the build process
  runBuild();
  
  console.log('Vercel build script completed successfully!');
}

// Run the script
main();

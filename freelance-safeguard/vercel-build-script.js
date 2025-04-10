// Custom build script for Vercel deployment
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
  projectRoot: path.resolve(__dirname),
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
    execSync('npm run build:landing', { 
      stdio: 'inherit',
      cwd: config.projectRoot
    });
    
    // Check if the build succeeded
    if (!fs.existsSync(path.join(config.distDir, 'landing.html'))) {
      console.error('ERROR: Build failed - landing.html not found in dist directory');
      process.exit(1);
    }
    
    // Copy landing.html to index.html in the dist directory
    console.log('Copying landing.html to index.html in dist directory...');
    fs.copyFileSync(
      path.join(config.distDir, 'landing.html'),
      path.join(config.distDir, 'index.html')
    );
    
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

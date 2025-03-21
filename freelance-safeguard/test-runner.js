#!/usr/bin/env node

/**
 * FreelanceShield Test Runner
 * 
 * This script provides an interactive CLI for running different test suites
 * for the FreelanceShield platform.
 */

const { execSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// ANSI color codes for better readability
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    crimson: '\x1b[38m'
  },
  
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
    crimson: '\x1b[48m'
  }
};

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Main menu options
const mainMenu = [
  { id: 1, name: 'Run Full System Test', action: runFullSystemTest },
  { id: 2, name: 'Run Solana Integration Tests', action: runSolanaTests },
  { id: 3, name: 'Run Frontend UI Tests', action: runUITests },
  { id: 4, name: 'Start Frontend Development Server', action: startDevServer },
  { id: 5, name: 'Check Solana Program Deployment', action: checkSolanaPrograms },
  { id: 6, name: 'View Manual Testing Checklist', action: viewManualChecklist },
  { id: 7, name: 'Run Performance Tests', action: runPerformanceTests },
  { id: 8, name: 'Run All Tests', action: runAllTests },
  { id: 9, name: 'Exit', action: exitProgram }
];

// Display the FreelanceShield ASCII art banner
function displayBanner() {
  console.log(`${colors.fg.blue}${colors.bright}`);
  console.log(`
  ███████╗██████╗ ███████╗███████╗██╗      █████╗ ███╗   ██╗ ██████╗███████╗███████╗██╗  ██╗██╗███████╗██╗     ██████╗ 
  ██╔════╝██╔══██╗██╔════╝██╔════╝██║     ██╔══██╗████╗  ██║██╔════╝██╔════╝██╔════╝██║  ██║██║██╔════╝██║     ██╔══██╗
  █████╗  ██████╔╝█████╗  █████╗  ██║     ███████║██╔██╗ ██║██║     █████╗  ███████╗███████║██║█████╗  ██║     ██║  ██║
  ██╔══╝  ██╔══██╗██╔══╝  ██╔══╝  ██║     ██╔══██║██║╚██╗██║██║     ██╔══╝  ╚════██║██╔══██║██║██╔══╝  ██║     ██║  ██║
  ██║     ██║  ██║███████╗███████╗███████╗██║  ██║██║ ╚████║╚██████╗███████╗███████║██║  ██║██║███████╗███████╗██████╔╝
  ╚═╝     ╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝╚══════╝╚══════╝╚═╝  ╚═╝╚═╝╚══════╝╚══════╝╚═════╝ 
                                                                                                                        
  `);
  console.log(`${colors.fg.cyan}                                     Test Runner v1.0.0${colors.reset}\n`);
}

// Display the main menu
function displayMainMenu() {
  console.log(`\n${colors.fg.yellow}${colors.bright}=== FreelanceShield Test Runner ====${colors.reset}\n`);
  mainMenu.forEach(option => {
    console.log(`${colors.fg.green}${option.id}${colors.reset}. ${option.name}`);
  });
  console.log('');
}

// Run the full system test script
function runFullSystemTest() {
  console.log(`\n${colors.fg.yellow}Running Full System Test...${colors.reset}\n`);
  try {
    execSync('bash ./test/full-system-test.sh', { stdio: 'inherit' });
    console.log(`\n${colors.fg.green}Full System Test completed.${colors.reset}`);
  } catch (error) {
    console.error(`\n${colors.fg.red}Error running Full System Test: ${error.message}${colors.reset}`);
  }
  promptForMainMenu();
}

// Run Solana integration tests
function runSolanaTests() {
  console.log(`\n${colors.fg.yellow}Running Solana Integration Tests...${colors.reset}\n`);
  try {
    execSync('npm run test:solana', { stdio: 'inherit' });
    console.log(`\n${colors.fg.green}Solana Integration Tests completed.${colors.reset}`);
  } catch (error) {
    console.error(`\n${colors.fg.red}Error running Solana Integration Tests: ${error.message}${colors.reset}`);
  }
  promptForMainMenu();
}

// Run UI tests
function runUITests() {
  console.log(`\n${colors.fg.yellow}Running Frontend UI Tests...${colors.reset}\n`);
  console.log(`${colors.fg.cyan}Note: Make sure the frontend development server is running.${colors.reset}`);
  
  try {
    // Check if Playwright is installed
    const hasPlaywright = fs.existsSync(path.join(process.cwd(), 'node_modules', '@playwright'));
    
    if (!hasPlaywright) {
      console.log(`\n${colors.fg.yellow}Playwright not found. Installing...${colors.reset}`);
      execSync('npm install --save-dev @playwright/test', { stdio: 'inherit' });
      execSync('npx playwright install', { stdio: 'inherit' });
    }
    
    // Run the UI tests
    execSync('npx playwright test test/ui-test.spec.ts', { stdio: 'inherit' });
    console.log(`\n${colors.fg.green}Frontend UI Tests completed.${colors.reset}`);
  } catch (error) {
    console.error(`\n${colors.fg.red}Error running Frontend UI Tests: ${error.message}${colors.reset}`);
  }
  promptForMainMenu();
}

// Start the frontend development server
function startDevServer() {
  console.log(`\n${colors.fg.yellow}Starting Frontend Development Server...${colors.reset}`);
  console.log(`${colors.fg.cyan}Press Ctrl+C to stop the server.${colors.reset}\n`);
  
  try {
    execSync('npm run dev', { stdio: 'inherit' });
  } catch (error) {
    // This will execute when the user presses Ctrl+C
    console.log(`\n${colors.fg.yellow}Development server stopped.${colors.reset}`);
  }
  promptForMainMenu();
}

// Check Solana program deployment
function checkSolanaPrograms() {
  console.log(`\n${colors.fg.yellow}Checking Solana Program Deployment...${colors.reset}\n`);
  
  // Read the program IDs from environment or config
  console.log(`${colors.fg.cyan}Enter the Insurance Program ID (or press Enter to skip):${colors.reset}`);
  rl.question('> ', (insuranceProgramId) => {
    if (insuranceProgramId) {
      try {
        console.log(`Checking Insurance Program (${insuranceProgramId})...`);
        execSync(`solana program show ${insuranceProgramId} --url devnet`, { stdio: 'inherit' });
      } catch (error) {
        console.error(`\n${colors.fg.red}Error checking Insurance Program: ${error.message}${colors.reset}`);
      }
    }
    
    console.log(`\n${colors.fg.cyan}Enter the Staking Program ID (or press Enter to skip):${colors.reset}`);
    rl.question('> ', (stakingProgramId) => {
      if (stakingProgramId) {
        try {
          console.log(`Checking Staking Program (${stakingProgramId})...`);
          execSync(`solana program show ${stakingProgramId} --url devnet`, { stdio: 'inherit' });
        } catch (error) {
          console.error(`\n${colors.fg.red}Error checking Staking Program: ${error.message}${colors.reset}`);
        }
      }
      
      console.log(`\n${colors.fg.cyan}Enter the Claims Program ID (or press Enter to skip):${colors.reset}`);
      rl.question('> ', (claimsProgramId) => {
        if (claimsProgramId) {
          try {
            console.log(`Checking Claims Program (${claimsProgramId})...`);
            execSync(`solana program show ${claimsProgramId} --url devnet`, { stdio: 'inherit' });
          } catch (error) {
            console.error(`\n${colors.fg.red}Error checking Claims Program: ${error.message}${colors.reset}`);
          }
        }
        
        console.log(`\n${colors.fg.green}Solana Program check completed.${colors.reset}`);
        promptForMainMenu();
      });
    });
  });
}

// View the manual testing checklist
function viewManualChecklist() {
  console.log(`\n${colors.fg.yellow}Manual Testing Checklist:${colors.reset}\n`);
  
  try {
    const checklist = fs.readFileSync(path.join(process.cwd(), 'test', 'manual-testing-checklist.md'), 'utf8');
    console.log(checklist);
  } catch (error) {
    console.error(`\n${colors.fg.red}Error reading manual testing checklist: ${error.message}${colors.reset}`);
  }
  
  promptForMainMenu();
}

// Run performance tests
function runPerformanceTests() {
  console.log(`\n${colors.fg.yellow}Running Performance Tests...${colors.reset}\n`);
  console.log(`${colors.fg.cyan}Note: Make sure the frontend development server is running.${colors.reset}`);
  
  try {
    // Simple performance test using curl
    console.log(`${colors.fg.cyan}Testing page load times...${colors.reset}`);
    
    console.log(`\nTesting homepage load time:`);
    execSync('curl -s -w "\\nTime to first byte: %{time_starttransfer}s\\nTotal time: %{time_total}s\\n" -o /dev/null http://localhost:5173/', { stdio: 'inherit' });
    
    console.log(`\nTesting dashboard load time:`);
    execSync('curl -s -w "\\nTime to first byte: %{time_starttransfer}s\\nTotal time: %{time_total}s\\n" -o /dev/null http://localhost:5173/dashboard', { stdio: 'inherit' });
    
    console.log(`\nTesting testnet demo load time:`);
    execSync('curl -s -w "\\nTime to first byte: %{time_starttransfer}s\\nTotal time: %{time_total}s\\n" -o /dev/null http://localhost:5173/testnet-demo', { stdio: 'inherit' });
    
    console.log(`\n${colors.fg.green}Performance Tests completed.${colors.reset}`);
  } catch (error) {
    console.error(`\n${colors.fg.red}Error running Performance Tests: ${error.message}${colors.reset}`);
  }
  
  promptForMainMenu();
}

// Run all tests
function runAllTests() {
  console.log(`\n${colors.fg.yellow}Running All Tests...${colors.reset}\n`);
  
  // Start the development server in the background
  console.log(`${colors.fg.cyan}Starting development server in the background...${colors.reset}`);
  const devServer = require('child_process').spawn('npm', ['run', 'dev'], {
    detached: true,
    stdio: 'ignore'
  });
  
  // Give the server time to start
  console.log(`${colors.fg.cyan}Waiting for server to start...${colors.reset}`);
  setTimeout(() => {
    try {
      // Run Solana tests
      console.log(`\n${colors.fg.yellow}Running Solana Integration Tests...${colors.reset}`);
      execSync('npm run test:solana', { stdio: 'inherit' });
      
      // Run UI tests
      console.log(`\n${colors.fg.yellow}Running Frontend UI Tests...${colors.reset}`);
      execSync('npx playwright test test/ui-test.spec.ts', { stdio: 'inherit' });
      
      // Run performance tests
      console.log(`\n${colors.fg.yellow}Running Performance Tests...${colors.reset}`);
      execSync('curl -s -w "\\nTime to first byte: %{time_starttransfer}s\\nTotal time: %{time_total}s\\n" -o /dev/null http://localhost:5173/', { stdio: 'inherit' });
      
      console.log(`\n${colors.fg.green}All Tests completed.${colors.reset}`);
    } catch (error) {
      console.error(`\n${colors.fg.red}Error running tests: ${error.message}${colors.reset}`);
    } finally {
      // Kill the development server
      console.log(`${colors.fg.cyan}Stopping development server...${colors.reset}`);
      process.kill(-devServer.pid);
      promptForMainMenu();
    }
  }, 5000);
}

// Exit the program
function exitProgram() {
  console.log(`\n${colors.fg.green}Thank you for using FreelanceShield Test Runner!${colors.reset}`);
  rl.close();
  process.exit(0);
}

// Prompt for main menu
function promptForMainMenu() {
  rl.question(`\n${colors.fg.yellow}Press Enter to continue...${colors.reset}`, () => {
    displayMainMenu();
    promptForMenuSelection();
  });
}

// Prompt for menu selection
function promptForMenuSelection() {
  rl.question(`${colors.fg.cyan}Select an option (1-${mainMenu.length}): ${colors.reset}`, (answer) => {
    const option = parseInt(answer);
    
    if (isNaN(option) || option < 1 || option > mainMenu.length) {
      console.log(`\n${colors.fg.red}Invalid option. Please try again.${colors.reset}`);
      promptForMenuSelection();
      return;
    }
    
    const selectedOption = mainMenu.find(item => item.id === option);
    if (selectedOption) {
      selectedOption.action();
    } else {
      console.log(`\n${colors.fg.red}Invalid option. Please try again.${colors.reset}`);
      promptForMenuSelection();
    }
  });
}

// Start the program
function start() {
  displayBanner();
  displayMainMenu();
  promptForMenuSelection();
}

// Run the program
start();

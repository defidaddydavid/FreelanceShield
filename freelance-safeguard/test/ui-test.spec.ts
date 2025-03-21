import { test, expect } from '@playwright/test';
import { Connection, PublicKey } from '@solana/web3.js';
import { NETWORK_CONFIG } from '../src/lib/solana/constants';

// Test suite for FreelanceShield UI testing
test.describe('FreelanceShield UI Tests', () => {
  // Before all tests, visit the homepage
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
  });

  // Test the homepage loads correctly
  test('homepage should load correctly', async ({ page }) => {
    await expect(page).toHaveTitle(/FreelanceShield/);
    await expect(page.locator('text=FreelanceShield')).toBeVisible();
  });

  // Test navigation to different pages
  test('navigation should work correctly', async ({ page }) => {
    // Test navigation to How It Works page
    await page.click('text=How It Works');
    await expect(page).toHaveURL(/.*how-it-works/);
    
    // Test navigation to Pricing page
    await page.click('text=Pricing');
    await expect(page).toHaveURL(/.*pricing/);
    
    // Test navigation to Testnet Demo page
    await page.goto('http://localhost:5173/testnet-demo');
    await expect(page).toHaveURL(/.*testnet-demo/);
    await expect(page.locator('text=FreelanceShield Testnet Demo')).toBeVisible();
  });

  // Test Demo Mode indicator
  test('demo mode indicator should be visible on testnet demo page', async ({ page }) => {
    await page.goto('http://localhost:5173/testnet-demo');
    
    // Connect wallet button should be visible
    const walletButton = page.locator('.wallet-adapter-button');
    await expect(walletButton).toBeVisible();
    
    // After clicking the wallet button, we should see demo mode options
    await walletButton.click();
    
    // Check for demo mode indicator (this may need adjustment based on actual UI)
    await expect(page.locator('text=Demo Mode')).toBeVisible();
  });

  // Test insurance policy creation form in demo mode
  test('insurance policy creation form should work in demo mode', async ({ page }) => {
    await page.goto('http://localhost:5173/testnet-demo');
    
    // Navigate to the policy creation tab if needed
    await page.click('text=Insurance Policy');
    
    // Test coverage amount slider
    const coverageSlider = page.locator('id=coverage').first();
    await coverageSlider.click();
    
    // Test period slider
    const periodSlider = page.locator('id=period').first();
    await periodSlider.click();
    
    // Test job type selection
    await page.click('text=Select job type');
    await page.click('text=WEB DEVELOPMENT');
    
    // Test industry selection
    await page.click('text=Select industry');
    await page.click('text=TECHNOLOGY');
    
    // Check if premium calculation updates
    await expect(page.locator('text=Estimated Premium:')).toBeVisible();
    
    // Test create policy button
    const createButton = page.locator('text=Create Policy');
    await expect(createButton).toBeVisible();
  });

  // Test claims submission form in demo mode
  test('claims submission form should work in demo mode', async ({ page }) => {
    await page.goto('http://localhost:5173/testnet-demo');
    
    // Navigate to the claims tab
    await page.click('text=Claims');
    
    // Test claim amount input
    await page.fill('input[placeholder="Claim amount in SOL"]', '1.5');
    
    // Test evidence type selection
    await page.click('text=Select evidence type');
    await page.click('text=PAYMENT_BREACH');
    
    // Test evidence description
    await page.fill('textarea[placeholder="Describe your evidence"]', 'Test evidence description');
    
    // Test submit claim button
    const submitButton = page.locator('text=Submit Claim');
    await expect(submitButton).toBeVisible();
  });

  // Test payment verification form in demo mode
  test('payment verification form should work in demo mode', async ({ page }) => {
    await page.goto('http://localhost:5173/testnet-demo');
    
    // Navigate to the payments tab
    await page.click('text=Payment Verification');
    
    // Test client address input
    await page.fill('input[placeholder="Client\'s Solana address"]', 'GvDMxPzNj1rGXPQm9jJ5NnGgKg6ZjfQ5xw2TbDs4UsJv');
    
    // Test expected amount input
    await page.fill('input[placeholder="Expected payment amount in SOL"]', '2.5');
    
    // Test deadline days slider
    const deadlineSlider = page.locator('id=deadline').first();
    await deadlineSlider.click();
    
    // Test verify payment button
    const verifyButton = page.locator('text=Verify Payment');
    await expect(verifyButton).toBeVisible();
  });

  // Test risk pool metrics display
  test('risk pool metrics should be displayed', async ({ page }) => {
    await page.goto('http://localhost:5173/testnet-demo');
    
    // Check for risk pool metrics card
    await expect(page.locator('text=Risk Pool Metrics')).toBeVisible();
    
    // Check for specific metrics
    await expect(page.locator('text=Total Staked')).toBeVisible();
    await expect(page.locator('text=Total Coverage')).toBeVisible();
    await expect(page.locator('text=Active Policies')).toBeVisible();
    await expect(page.locator('text=Reserve Ratio')).toBeVisible();
  });

  // Test staking page
  test('staking page should load correctly', async ({ page }) => {
    await page.goto('http://localhost:5173/staking');
    
    // Check for staking title
    await expect(page.locator('text=Staking Dashboard')).toBeVisible();
    
    // Check for staking components
    await expect(page.locator('text=Risk Pool Metrics')).toBeVisible();
    await expect(page.locator('text=Your Stake')).toBeVisible();
    await expect(page.locator('text=Stake SOL')).toBeVisible();
  });

  // Test premium calculator
  test('premium calculator should work correctly', async ({ page }) => {
    await page.goto('http://localhost:5173/insurance/premium-calculator');
    
    // Check for calculator title
    await expect(page.locator('text=Insurance Premium Calculator')).toBeVisible();
    
    // Test coverage amount input
    await page.fill('input[placeholder="Coverage amount in SOL"]', '10');
    
    // Test period input
    await page.fill('input[placeholder="Coverage period in days"]', '30');
    
    // Test job type selection
    await page.click('text=Select job type');
    await page.click('text=WEB DEVELOPMENT');
    
    // Test industry selection
    await page.click('text=Select industry');
    await page.click('text=TECHNOLOGY');
    
    // Check if premium calculation updates
    await expect(page.locator('text=Estimated Premium:')).toBeVisible();
    
    // Check if risk score is displayed
    await expect(page.locator('text=Risk Score:')).toBeVisible();
  });

  // Test wallet connection UI
  test('wallet connection UI should work correctly', async ({ page }) => {
    // Check for wallet button
    const walletButton = page.locator('.wallet-adapter-button');
    await expect(walletButton).toBeVisible();
    
    // Click wallet button
    await walletButton.click();
    
    // Check for wallet options
    await expect(page.locator('text=Select Wallet')).toBeVisible();
    
    // Check for specific wallet options
    await expect(page.locator('text=Phantom')).toBeVisible();
    await expect(page.locator('text=Solflare')).toBeVisible();
  });

  // Test error handling
  test('error handling should work correctly', async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard');
    
    // Without wallet connection, we should see an error or prompt
    await expect(page.locator('text=Connect your wallet')).toBeVisible();
  });
});

// Test suite for Solana integration
test.describe('Solana Integration Tests', () => {
  test('should connect to Solana Devnet', async () => {
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const version = await connection.getVersion();
    expect(version).toBeDefined();
  });

  test('should have valid network configuration', () => {
    expect(NETWORK_CONFIG).toBeDefined();
    expect(NETWORK_CONFIG.lamportsPerSol).toBe(1000000000);
    expect(NETWORK_CONFIG.minCoverageAmount).toBeGreaterThan(0);
    expect(NETWORK_CONFIG.maxCoverageAmount).toBeGreaterThan(NETWORK_CONFIG.minCoverageAmount);
  });
});

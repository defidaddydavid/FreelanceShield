# FreelanceShield Manual Testing Checklist

This document provides a comprehensive checklist for manually testing the FreelanceShield platform, covering both the Demo Mode and Live Solana Devnet Mode.

## Prerequisites

- [ ] Solana CLI tools installed and configured for Devnet
- [ ] Phantom, Solflare, or Backpack wallet with Devnet SOL
- [ ] Node.js and npm installed
- [ ] FreelanceShield repository cloned and dependencies installed

## Backend and Smart Contract Testing

### Solana Program Deployment Verification

- [ ] Verify Insurance Program is deployed to Devnet
  ```bash
  solana program show --url devnet <INSURANCE_PROGRAM_ID>
  ```
- [ ] Verify Staking Program is deployed to Devnet
  ```bash
  solana program show --url devnet <STAKING_PROGRAM_ID>
  ```
- [ ] Verify Claims Program is deployed to Devnet
  ```bash
  solana program show --url devnet <CLAIMS_PROGRAM_ID>
  ```
- [ ] Verify Escrow Program is deployed to Devnet (if applicable)
  ```bash
  solana program show --url devnet <ESCROW_PROGRAM_ID>
  ```
- [ ] Verify DAO Governance Program is deployed to Devnet (if applicable)
  ```bash
  solana program show --url devnet <DAO_PROGRAM_ID>
  ```

### API and Backend Services

- [ ] Confirm API endpoints are accessible
- [ ] Verify backend services are running
- [ ] Check logs for any errors or warnings

## Frontend Testing

### Application Startup

- [ ] Start the application with `npm run dev`
- [ ] Verify the application loads without errors in the console
- [ ] Check that all pages are accessible via navigation

### Wallet Connection

- [ ] Connect Phantom wallet
- [ ] Connect Solflare wallet
- [ ] Connect Backpack wallet
- [ ] Verify wallet address is displayed correctly
- [ ] Check wallet balance is fetched and displayed
- [ ] Test wallet disconnection functionality

### Demo Mode Testing

- [ ] Toggle Demo Mode on
- [ ] Verify Demo Mode indicator is visible
- [ ] Check that mock policies are displayed
- [ ] Test creating a policy in Demo Mode
- [ ] Verify premium calculation works correctly
- [ ] Submit a claim in Demo Mode
- [ ] Test payment verification in Demo Mode
- [ ] Verify staking simulation in Demo Mode
- [ ] Toggle Demo Mode off
- [ ] Confirm smooth transition back to Live Mode

### Live Solana Devnet Testing

#### Insurance Policy Creation

- [ ] Create a new insurance policy
- [ ] Verify transaction signature is returned
- [ ] Check policy details are stored on-chain
- [ ] Confirm premium payment transaction is processed
- [ ] Test policy with different coverage amounts
- [ ] Test policy with different job types
- [ ] Test policy with different industries

#### Claims Processing

- [ ] Submit a new claim
- [ ] Verify claim is recorded on-chain
- [ ] Test claim with evidence attachments
- [ ] Check claim status updates
- [ ] Test claim approval process (if implemented)
- [ ] Test claim rejection process (if implemented)

#### Staking Functionality

- [ ] Stake tokens to the risk pool
- [ ] Verify staking transaction is processed
- [ ] Check staking rewards accrual
- [ ] Test unstaking functionality
- [ ] Verify reserve ratio calculations

#### Payment Verification

- [ ] Create a payment verification request
- [ ] Test with valid client public key
- [ ] Verify deadline setting functionality
- [ ] Test payment confirmation process
- [ ] Test missed payment claim process

#### DAO Governance (if implemented)

- [ ] Create a governance proposal
- [ ] Cast votes on proposals
- [ ] Check vote tallying
- [ ] Test proposal execution

## UI/UX Testing

### Responsive Design

- [ ] Test on desktop (1920x1080)
- [ ] Test on laptop (1366x768)
- [ ] Test on tablet (768x1024)
- [ ] Test on mobile (375x667)

### Cross-Browser Compatibility

- [ ] Test on Chrome
- [ ] Test on Firefox
- [ ] Test on Safari
- [ ] Test on Edge

### Error Handling

- [ ] Test with insufficient balance
- [ ] Test with invalid inputs
- [ ] Test with network disconnection
- [ ] Verify error messages are clear and helpful

### Performance

- [ ] Check page load times
- [ ] Test transaction processing times
- [ ] Verify UI responsiveness during blockchain operations
- [ ] Test with multiple policies and claims

## Security Testing

- [ ] Verify wallet signature requests are clear
- [ ] Check transaction approval UI
- [ ] Test with invalid transaction attempts
- [ ] Verify proper error handling for security-related issues

## Final Verification

- [ ] Ensure all critical paths work in both Demo and Live modes
- [ ] Verify data consistency between UI and blockchain
- [ ] Check for any console errors or warnings
- [ ] Test complete user journeys from policy creation to claim submission

## Test Results

| Test Category | Pass/Fail | Notes |
|---------------|-----------|-------|
| Backend Services | | |
| Smart Contracts | | |
| Wallet Connection | | |
| Demo Mode | | |
| Live Mode | | |
| UI/UX | | |
| Security | | |
| Performance | | |

## Issues Found

- Issue 1: [Description]
- Issue 2: [Description]
- Issue 3: [Description]

## Recommendations

- Recommendation 1: [Description]
- Recommendation 2: [Description]
- Recommendation 3: [Description]

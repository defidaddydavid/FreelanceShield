# FreeLanceShield Smart Contract System

A comprehensive Solana Devnet-based smart contract system for FreelanceShield, providing insurance policies, risk assessment, claims processing, escrow protections, and DAO governance.

## System Architecture

The FreeLanceShield contract system consists of five modular and upgradeable programs:

1. **Insurance Program** - Handles policy creation, management, and cancellation
2. **Claims Processor** - Manages claim submissions, verification, and payouts
3. **Risk Pool Program** - Manages capital reserves and risk assessment
4. **Escrow Program** - Protects freelancer payments through escrow contracts
5. **DAO Governance** - Allows users to stake and vote on insurance parameters

## Key Features

- **Modular Design**: Each program handles a specific aspect of the system
- **Upgradeable**: Programs can be upgraded independently
- **Gas Efficient**: Optimized for minimal transaction costs
- **Secure**: Follows Solana security best practices
- **Demo Mode Support**: Contracts support both real execution and demo mode

## Technical Implementation

### Insurance Program

The Insurance Program manages the creation and lifecycle of insurance policies. Key features include:

- Policy creation with customizable coverage amounts and periods
- Risk-based premium calculation
- Policy cancellation with prorated refunds
- Configurable parameters for minimum/maximum coverage

### Claims Processor

The Claims Processor handles claim submissions and verification. Key features include:

- Claim submission with evidence attachments
- AI-powered risk scoring for fraud detection
- Automatic approval for low-risk claims
- Manual review for high-risk claims
- Arbitration system for disputed claims

### Risk Pool Program

The Risk Pool Program manages the capital reserves and risk assessment. Key features include:

- Capital deposits and withdrawals
- Monte Carlo simulations for dynamic premium adjustments
- Reserve ratio management
- Risk-based capital adequacy assessment

## Deployment Instructions

### Prerequisites

- Solana CLI tools installed and configured
- Anchor framework installed
- A funded Solana devnet wallet

### Deploying to Devnet

We've created a deployment script to simplify the process of deploying the contracts to Solana devnet and updating the frontend constants:

```bash
# Navigate to the contracts directory
cd freelance-safeguard-contracts

# Make sure you have a funded devnet wallet
solana balance --url devnet

# Run the deployment script
node scripts/deploy-to-devnet.js
```

The script will:
1. Build all Anchor programs
2. Deploy them to Solana devnet
3. Extract the program IDs
4. Update the frontend constants file with the new program IDs

### Manual Deployment

If you prefer to deploy manually:

```bash
# Build the programs
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Get the program IDs
solana address -k target/deploy/insurance_program-keypair.json
solana address -k target/deploy/claims_processor-keypair.json
solana address -k target/deploy/risk_pool_program-keypair.json
solana address -k target/deploy/escrow_program-keypair.json
solana address -k target/deploy/dao_governance-keypair.json
```

Then update the program IDs in the frontend constants file manually.

### Testing the Deployment

After deployment, you can test the integration using the Solana Integration Test page in the frontend:

1. Start the frontend application
2. Navigate to `/solana-test`
3. Connect your wallet
4. Test the various SDK functions

### Escrow Program

The Escrow Program protects freelancer payments. Key features include:

- Milestone-based escrow contracts
- Dispute resolution mechanism
- Automatic release options
- Client-initiated milestone releases

### DAO Governance

The DAO Governance program allows users to participate in system governance. Key features include:

- Token staking for voting rights
- Proposal creation and voting
- Parameter updates through governance
- Execution delay for security

## Monte Carlo Simulation

The system implements Monte Carlo simulations to dynamically adjust insurance premiums based on risk. The simulation:

1. Estimates expected losses based on policy count and claim frequency
2. Calculates Value at Risk (VaR) at 95% and 99% confidence levels
3. Determines recommended capital requirements
4. Adjusts premiums based on capital adequacy

## AI-Powered Claim Verification

The claims processor includes an AI-powered risk scoring system that:

1. Evaluates claim amount relative to coverage
2. Considers policy age and previous claims
3. Assigns a risk score to each claim
4. Automatically approves low-risk claims
5. Flags high-risk claims for manual review


## Deployment

All contracts are deployed on Solana Devnet with the following program IDs:

- Insurance Program: `5YQrtSDqiRsVTJ4ZxLEHbcNTibiJrMsYTGNs3kRqKLRW`
- Risk Pool Program: `7YarYNBF8GYZ5yzrUJGR3yHVs6SQapPezvnJrKRFUeD7`
- Claims Processor: `9ot9f4UgMKPdHHgHqkKJrEGmpGBgk9Kxg8xJPJsxGYNY`
- Escrow Program: `8ZU8MgTZG3UAYu5ChPKCCqGBiV9RGR9WJZLJcWA1UDxz`
- DAO Governance: `DAoGXKLYx3MgXkJxv1e4W5D4LQkbtqxnDRBUVJAqMSLt`

## Security Considerations

The contract system implements several security measures:

- PDAs (Program Derived Addresses) for secure account management
- Proper authority checks for all sensitive operations
- Signer verification for all transactions
- Reserve ratio requirements to ensure solvency
- Execution delays for governance actions

## Enhancement Plan

### 1. Premium Model Improvements (High Priority)
- **Dynamic Risk Weights**: Implement adaptive weights based on historical data
- **Advanced Monte Carlo Simulations**: Enhance with sophisticated statistical methods
- **Market Condition Integration**: Add real-time market condition adjustments
- **Machine Learning Integration**: Develop off-chain ML models for premium prediction
- **User Reputation System**: Enhance reputation factor calculation with granular metrics

### 2. Governance Finalization (Medium Priority)
- **Voting Mechanism Improvements**: Implement quadratic voting and delegation
- **Proposal System Refinement**: Add templates and discussion periods
- **Treasury Management**: Create DAO treasury with multi-signature requirements
- **Cross-Program Governance**: Implement unified governance across all programs
- **Governance Analytics**: Add on-chain analytics for participation tracking

### 3. Risk-Based Pricing Enhancements (High Priority)
- **Granular Risk Categories**: Expand job types and industry categories
- **Claim Severity Analysis**: Enhance risk scoring with severity prediction
- **External Risk Data Integration**: Add oracle integration for external data
- **Real-Time Risk Adjustment**: Implement continuous assessment during policy lifetime
- **Capital Efficiency Optimization**: Enhance reserve calculations with risk-weighted assets

## Future Enhancements

Planned future enhancements include:

- Dynamic risk weights based on actual claims data
- Enhanced fraud detection algorithms
- Multi-token support
- Cross-chain compatibility
- Mainnet deployment with additional security audits

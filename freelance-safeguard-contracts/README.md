# FreelanceShield Smart Contracts

A comprehensive Solana-based smart contract system for FreelanceShield, providing insurance policies, risk assessment, claims processing, and DAO governance.

## System Architecture

The FreelanceShield contract system consists of five modular and upgradeable programs:

1. **Core Program** - Central coordination module and main entry point
2. **Insurance Program** - Handles policy creation, management, and cancellation
3. **Claims Processor** - Manages claim submissions, verification, and payouts
4. **Risk Pool Program** - Manages capital reserves and risk assessment
5. **DAO Governance** - Allows users to stake and vote on insurance parameters

## Key Technical Features

- **Modular Design**: Each program handles a specific aspect of the system
- **Bayesian Verification**: AI-powered risk scoring for claims verification
- **Fixed Point Arithmetic**: Precision-safe calculations without floating point
- **Multi-Signature Security**: Critical operations require multiple approvals
- **Timelock Mechanism**: Delay for sensitive parameter updates
- **Circuit Breaker Pattern**: Automatic pause on suspicious activity
- **Capital Adequacy Checks**: Ensures sufficient reserves for coverage
- **Adaptive Learning**: Models improve over time based on actual outcomes

## Security Enhancements

Based on comprehensive analysis, the following security enhancements have been implemented:

1. **Reentrancy Protection**
   - Added `is_processing` flag to prevent reentrancy attacks
   - Implemented proper guards in critical functions

2. **Timelock for Critical Operations**
   - Added timelock mechanism for parameter updates
   - Created pending update fields in the ProgramState struct

3. **Fixed Point Arithmetic**
   - Replaced floating point with fixed point arithmetic
   - Used precision factor of 10000 to maintain accuracy

4. **Circuit Breaker Pattern**
   - Implemented rate limiting for claim submissions
   - Added automatic system pause on suspicious activity

5. **Multi-Signature Requirements**
   - Added secondary authority for critical operations
   - Required multiple signers for parameter updates

6. **Capital Adequacy Checks**
   - Added verification of capital reserves
   - Implemented ratio calculation for capital health

## Prerequisites

- Solana CLI tools installed and configured
- Anchor framework installed
- Rust 1.81.0 or later

## Development Setup

```bash
# Clone the repository
git clone https://github.com/FreelanceShield/freelance-safeguard-contracts.git
cd freelance-safeguard-contracts

# Install dependencies
npm install

# Build the programs
anchor build

# Run tests
anchor test
```

## Deployment Instructions

```bash
# Deploy to devnet
anchor deploy --provider.cluster devnet

# Get the program IDs
solana address -k target/deploy/core-keypair.json
solana address -k target/deploy/insurance_program-keypair.json
solana address -k target/deploy/claims_processor-keypair.json
solana address -k target/deploy/risk_pool_program-keypair.json
solana address -k target/deploy/dao_governance-keypair.json
```

## Program IDs

All contracts are deployed on Solana Devnet with the following program IDs:

- Core Program: `BWop9ejaeHDK9ktZivqzqwgZMN8kituGYM7cKqrpNiaE`
- Insurance Program: `5YQrtSDqiRsVTJ4ZxLEHbcNTibiJrMsYTGNs3kRqKLRW`
- Risk Pool Program: `7YarYNBF8GYZ5yzrUJGR3yHVs6SQapPezvnJrKRFUeD7`
- Claims Processor: `9ot9f4UgMKPdHHgHqkKJrEGmpGBgk9Kxg8xJPJsxGYNY`
- DAO Governance: `DAoGXKLYx3MgXkJxv1e4W5D4LQkbtqxnDRBUVJAqMSLt`

## Project Structure

```
programs/
├── core/                 # Central coordination module
├── claims-processor/     # Claims processing and verification
├── risk-pool-program/    # Capital reserves and risk assessment
├── insurance-program/    # Policy management
├── dao-governance/       # Governance and voting
└── other modules...      # Additional supporting modules

app/                      # Client-side SDK and utilities
scripts/                  # Deployment and utility scripts
tests/                    # Integration and unit tests
```

## Future Enhancements

- Enhanced fraud detection algorithms
- Multi-token support
- Cross-chain compatibility
- Mainnet deployment with additional security audits

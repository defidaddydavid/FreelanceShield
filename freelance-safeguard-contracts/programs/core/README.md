# FreelanceShield Core Program

A comprehensive Solana/Anchor program for freelance insurance management, inspired by Nexus Mutual's Ethereum-based insurance contracts.

## Overview

The FreelanceShield Core Program consolidates the functionality of multiple programs into a single, efficient smart contract that handles all aspects of freelance insurance:

- Insurance product management
- Policy issuance and management
- Claims processing and voting
- Risk pool management
- Capital provider management

## Program Structure

```
core/
├── src/
│   ├── instructions/        # Instruction handlers
│   │   ├── program/         # Program initialization and updates
│   │   ├── product/         # Product management
│   │   ├── policy/          # Policy management
│   │   ├── claim/           # Claims processing
│   │   └── risk/            # Risk pool management
│   ├── state/               # Account structures
│   │   ├── program_state.rs # Global program parameters
│   │   ├── product.rs       # Insurance product definitions
│   │   ├── policy.rs        # Policy account structure
│   │   ├── claim.rs         # Claim account structure
│   │   ├── risk_pool.rs     # Risk pool management
│   │   ├── capital_provider.rs # Capital provider accounts
│   │   ├── common.rs        # Common enums and definitions
│   │   └── constants.rs     # Program constants
│   ├── utils/               # Utility functions
│   │   └── risk_calculations.rs # Risk calculation utilities
│   └── lib.rs               # Program entry points and error definitions
└── Cargo.toml               # Dependencies
```

## Key Features

### Product Management
- Create, update, activate, and deactivate insurance products
- Configure coverage parameters, pricing, and risk factors

### Policy Management
- Purchase policies with premium calculation
- Cancel policies with refund calculation
- Renew policies
- Tokenize policies as NFTs

### Claims Processing
- Submit claims with evidence
- Community-based claim voting
- Admin claim processing
- Claim payment
- Dispute resolution and arbitration

### Risk Management
- Risk pool initialization and management
- Capital deposits and withdrawals
- Risk simulation and metrics
- Premium adjustment based on risk factors

## Dependencies

- Anchor Framework 0.31.0
- Solana Program Library
- Anchor SPL

## Building and Testing

This program is designed to be built using Anchor in a WSL environment:

```bash
cd freelance-safeguard-contracts
anchor build
```

## Inspired by Nexus Mutual

This implementation draws inspiration from Nexus Mutual's Ethereum-based insurance contracts, adapting key concepts to the Solana blockchain:

- Cover & Insurance-Related Contracts
- Claims Handling & Risk Management
- Staking & Liquidity Management
- Governance & Reputation System
- Tokenomics & Financial Model

## License

[MIT License](LICENSE)

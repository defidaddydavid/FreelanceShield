# FreelanceShield Smart Contracts

FreelanceShield is a Solana-based insurance platform designed to protect freelancers and clients in digital service transactions. This repository contains the smart contract code for the FreelanceShield platform.

## Architecture

FreelanceShield uses a modular architecture with the following key components:

- **Authentication System**: Exclusively uses Privy for authentication and wallet integration
- **Reputation System**: Integrated with Ethos Network for comprehensive reputation scoring
- **Feature Flag System**: Enables gradual rollout of new features
- **Policy Management**: Handles insurance policy creation, management, and claims

For a detailed overview of the architecture, see the [Architecture Documentation](./docs/ARCHITECTURE.md).

## Key Features

- **Privy Authentication**: Social login options with wallet creation and embedded wallet for new users
- **Ethos Reputation Integration**: Comprehensive scoring based on vouches, reviews, and on-chain activity
- **Feature Flag System**: Controlled rollout of new technologies
- **Modular Design**: Clear separation of concerns with abstraction layers

## Getting Started

### Prerequisites

- Solana CLI tools
- Anchor framework
- Rust and Cargo

### Installation

1. Clone the repository:
```bash
git clone https://github.com/FreelanceShield/freelance-safeguard-contracts.git
cd freelance-safeguard-contracts
```

2. Install dependencies:
```bash
npm install
```

3. Build the program:
```bash
anchor build
```

### Deployment

1. Deploy to a local validator:
```bash
anchor deploy
```

2. Deploy to devnet:
```bash
anchor deploy --provider.cluster devnet
```

## Integration

For detailed integration instructions, see the [Integration Guide](./docs/INTEGRATION_GUIDE.md).

## Documentation

- [Architecture Documentation](./docs/ARCHITECTURE.md): Detailed overview of the system architecture
- [Integration Guide](./docs/INTEGRATION_GUIDE.md): Instructions for integrating with FreelanceShield
- [API Reference](./docs/API_REFERENCE.md): Comprehensive API documentation

## Development

### Project Structure

```
freelance-safeguard-contracts/
├── programs/
│   ├── core/                   # Main insurance program
│   │   ├── src/
│   │   │   ├── adapters/       # External service adapters
│   │   │   ├── instructions/   # Instruction handlers
│   │   │   ├── interfaces/     # Abstract interfaces
│   │   │   ├── state/          # Program state definitions
│   │   │   ├── error_helpers.rs # Error definitions
│   │   │   └── lib.rs          # Program entry point
│   └── ...
├── tests/                      # Integration tests
├── app/                        # Example frontend application
└── docs/                       # Documentation
```

### Testing

Run the test suite:
```bash
anchor test
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Solana](https://solana.com/)
- [Anchor](https://project-serum.github.io/anchor/)
- [Privy](https://privy.io/)
- [Ethos Network](https://ethos.so/)

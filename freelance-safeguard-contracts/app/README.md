# FreelanceShield Frontend

A Solana-based freelance insurance platform using Anchor framework that enables users to purchase insurance policies against contract breaches and submit claims for dispute resolution.

## Features

- **Phantom Wallet Integration**: Uses Phantom Wallet as the primary authentication method
- **Smart Contract Integration**: Direct interactions with Solana smart contracts
- **Reputation System**: Bayesian reputation-based premium calculations
- **Real Blockchain Data**: All UI displays real on-chain data (no mock data)

## Getting Started

### Prerequisites

- Node.js v16+ and npm
- Solana CLI tools
- Anchor v0.26.0+
- Phantom Wallet browser extension

### Installation

1. Install dependencies:

```bash
cd app
npm install
```

2. Build the smart contracts and generate IDL files:

```bash
cd ..
anchor build
```

3. Copy IDL files to the frontend:

```bash
node scripts/copy-idls.js
```

### Development

1. Start the local development server:

```bash
cd app
npm start
```

2. Open your browser and navigate to `http://localhost:3000`

3. Connect your Phantom Wallet to interact with the application

### Deployment

1. For Devnet deployments:
   - Ensure your contracts are deployed to Devnet
   - Update the program IDs in `src/utils/contract-integration.ts`
   - Build the frontend application: `npm run build`
   - Deploy the build folder to your hosting provider

2. For Mainnet deployments:
   - Follow the same steps but ensure contracts are fully audited
   - Update the network in wallet-adapter.ts to `WalletAdapterNetwork.Mainnet`
   - Ensure all contracts have been thoroughly tested

## Smart Contract Integration

The frontend interacts with the following Solana programs:

- **Core Program**: Central coordinating program for the protocol
- **Risk Pool Program**: Handles capital management and premium calculations
- **Claims Processor**: Processes insurance claims and payouts
- **Reputation Program**: Bayesian reputation scoring
- **Policy NFT**: NFT representation of insurance policies

## Security Considerations

- All transactions are signed using Phantom Wallet
- No private keys are stored in the frontend
- All data is verified on-chain
- Reputation scores are calculated using verifiable on-chain data

## Development Guidelines

- All UI components should only display real blockchain data
- Follow TypeScript best practices and maintain type safety
- Implement proper error handling for failed transactions
- Ensure adequate loading states during blockchain operations
- Use React hooks for state management and clean component architecture

## License

MIT

# FreelanceShield Protocol Treasury & Deployer Wallet Setup

## Creating Your Protocol Treasury Wallet

For maximum security and management capabilities, we recommend using Solflare as your primary wallet for the protocol treasury.

### Step 1: Create a new wallet in Solflare

1. Download Solflare from [https://solflare.com/](https://solflare.com/)
2. Click "Create New Wallet"
3. Follow the instructions to generate a new wallet
4. **IMPORTANT**: Store the seed phrase securely (offline) and create multiple backups

### Step 2: Fund Your Wallet

1. Transfer at least 1 SOL to your new wallet for transaction fees
2. Transfer USDC-SPL to the wallet (for protocol operations)

### Step 3: Export Private Key for Development

For local development and testing, you can export your private key:

1. In Solflare, click on the three dots next to your wallet
2. Select "Export Private Key"
3. Enter your password
4. Save this key in a secure location for development use only
5. Add this key to your `.env` file (never commit this to Git)

### Step 4: Link Your Wallet to freelanceshield.xyz

1. Go to [unstoppabledomains.com/domains](https://unstoppabledomains.com/domains)
2. Log in and manage your freelanceshield.xyz domain
3. In the "Crypto" tab, add your new wallet addresses:
   - Add your Solana address in the "SOL" field
   - Add the same address in the "USDC-SPL" field (Solana uses the same address for all SPL tokens)

## Security Best Practices

- Never share your seed phrase or private key
- Consider using a hardware wallet for additional security
- Set up a multi-sig wallet for the DAO treasury later on
- Keep development funds separate from production funds

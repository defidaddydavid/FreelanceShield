# FreelanceShield Solana Deployment Guide (Ubuntu Terminal)

This guide will help you deploy your Solana smart contracts to devnet using your Ubuntu terminal.

## Step 1: Navigate to the Project Directory

Open your Ubuntu terminal and navigate to your project directory. If your project is in Windows, you'll need to access it through the `/mnt` path:

```bash
cd /mnt/c/Users/User/OneDrive\ -\ UvA/Documents/FreeLanceShield/freelance-safeguard-contracts
```

## Step 2: Install Required Tools

Ensure you have the necessary tools installed:

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.16.14/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Install Anchor CLI
npm install -g @coral-xyz/anchor-cli

# Install Rust if not already installed
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"
```

## Step 3: Configure Solana for Devnet

```bash
solana config set --url devnet
```

## Step 4: Create or Import a Wallet

Create a new wallet or import an existing one:

```bash
# Create new wallet
solana-keygen new --no-bip39-passphrase -o devnet-deploy.json

# OR import existing wallet (if you have a recovery phrase)
# solana-keygen recover -o devnet-deploy.json
```

## Step 5: Set the Wallet as Default

```bash
solana config set --keypair devnet-deploy.json
```

## Step 6: Fund Your Wallet

Get your wallet address and fund it with devnet SOL:

```bash
solana address
```

Visit https://solfaucet.com/ and request SOL for your wallet address.

Verify your balance:

```bash
solana balance
```

Make sure you have at least 2 SOL for deployment.

## Step 7: Build the Programs

```bash
anchor build
```

## Step 8: Deploy to Devnet

```bash
anchor deploy --provider.cluster devnet
```

## Step 9: Verify Deployment

After deployment, check if your programs are deployed:

```bash
solana account <program-id>
```

Replace `<program-id>` with the program IDs from the deployment output.

## Step 10: Update Frontend Constants

After successful deployment, update your frontend constants file with the new program IDs:

1. Open `src/lib/solana/constants.ts` in your frontend project
2. Update the program IDs with the newly deployed ones
3. Set `USE_MOCK_DATA` to `false` in any relevant files

## Troubleshooting

### If Anchor Build Fails

Try cleaning the build first:

```bash
anchor clean
anchor build
```

### If Deployment Fails Due to Insufficient Funds

Request more SOL from the faucet:

```bash
solana airdrop 2
```

Or visit https://solfaucet.com/ for more SOL.

### If Program Verification Fails

Check the program logs:

```bash
solana logs <program-id>
```

This will help identify any issues with your deployed program.

# FreelanceShield: WSL Setup and Smart Contract Deployment Guide

This guide will walk you through setting up Windows Subsystem for Linux (WSL) and deploying the FreelanceShield smart contracts to the Solana devnet.

## Part 1: Setting Up WSL and Installing Dependencies

### 1. Install Windows Subsystem for Linux (WSL)

Open PowerShell as administrator and run:

```powershell
wsl --install
```

This will install Ubuntu as the default Linux distribution. Restart your computer after installation.

### 2. Install Linux Dependencies

Once WSL is installed, open your Ubuntu terminal and install the required packages:

```bash
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y curl build-essential git pkg-config libudev-dev libssl-dev
```

### 3. Install Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"
```

Verify installation:
```bash
rustc --version
```

### 4. Install Solana CLI

```bash
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
```

Add Solana to your PATH:

```bash
# For Bash shell
echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# For Zsh shell
echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

Verify installation:
```bash
solana --version
```

### 5. Install Anchor CLI via AVM (Anchor Version Manager)

```bash
cargo install --git https://github.com/coral-xyz/anchor avm --force
avm install latest
avm use latest
```

Verify installation:
```bash
anchor --version
```

### 6. Install Node.js and Yarn

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g yarn
```

## Part 2: Contract Deployment to Devnet

### 1. Configure Solana for Devnet

```bash
solana config set --url https://api.devnet.solana.com
```

### 2. Create a New Keypair for Deployment

```bash
solana-keygen new -o ~/devnet-deploy.json
```

### 3. Get Your Wallet Address

```bash
solana-keygen pubkey ~/devnet-deploy.json
```

### 4. Fund Your Wallet

You have a few options to get devnet SOL:

**Option 1: Use the Solana CLI**
```bash
solana airdrop 2 --keypair ~/devnet-deploy.json
```

**Option 2: Use a faucet website**
Visit [https://faucet.anza.xyz/](https://faucet.anza.xyz/) and enter your wallet address.

**Option 3: Use airdropIfRequired helper**
If you're scripting this process, consider using the `@solana-developers/helpers` package:

```bash
npm install @solana-developers/helpers
```

Then in your script:
```javascript
import { airdropIfRequired } from '@solana-developers/helpers';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

const newBalance = await airdropIfRequired(
  connection,
  keypair.publicKey,
  0.5 * LAMPORTS_PER_SOL,
  1 * LAMPORTS_PER_SOL,
);
```

### 5. Update Anchor.toml

Navigate to your project directory in WSL and update your `Anchor.toml` file:

```toml
[programs.devnet]
insurance_program = "5YQrtSDqiRsVTJ4ZxLEHbcNTibiJrMsYTGNs3kRqKLRW"
risk_pool_program = "7YarYNBF8GYZ5yzrUJGR3yHVs6SQapPezvnJrKRFUeD7"
claims_processor = "9ot9f4UgMKPdHHgHqkKJrEGmpGBgk9Kxg8xJPJsxGYNY"
escrow_program = "8ZU8MgTZG3UAYu5ChPKCCqGBiV9RGR9WJZLJcWA1UDxz"
dao_governance = "DAoGXKLYx3MgXkJxv1e4W5D4LQkbtqxnDRBUVJAqMSLt"

[provider]
cluster = "devnet"
wallet = "~/devnet-deploy.json"
```

### 6. Build and Deploy Contracts

```bash
# Navigate to your project directory
cd /mnt/c/Users/User/OneDrive\ -\ UvA/Documents/FreeLanceShield/freelance-safeguard-contracts

# Build the contracts
anchor build

# Deploy to devnet
anchor deploy
```

### 7. Update Frontend Configuration

After deployment, copy the program IDs from the Anchor deployment output and update your frontend constants:

```typescript
// src/lib/solana/constants.ts
export const INSURANCE_PROGRAM_ID = new PublicKey('your_deployed_insurance_program_id');
export const RISK_POOL_PROGRAM_ID = new PublicKey('your_deployed_risk_pool_program_id');
export const CLAIMS_PROCESSOR_PROGRAM_ID = new PublicKey('your_deployed_claims_processor_id');
```

### 8. Disable Mock Data

Open `src/lib/solana/hooks/useRiskPoolData.ts` and change:

```typescript
const USE_MOCK_DATA = false;
```

## Alternative: Using Local Validator For Development

If you're encountering rate limit issues with devnet, you can use a local validator:

```bash
# Start a local validator
solana-test-validator

# In a new terminal, configure Solana to use localhost
solana config set --url localhost
```

Then update your Anchor.toml to use localnet:

```toml
[provider]
cluster = "localnet"
wallet = "~/devnet-deploy.json"
```

## Troubleshooting

### Common Issues

1. **Error: could not exec the linker `cc`**
   Solution: `sudo apt-get install build-essential`

2. **Error: Permission denied (os error 13)**
   Solution: Check file permissions with `ls -la` and fix with `chmod +x filename`

3. **Error: not a directory / lock file version 4 requires -Znext-lockfile-bump**
   Solution: Install a newer version of Rust with `rustup update`

4. **Error: airdrop request failed due to rate limit**
   Solution: Use a different faucet or wait a while before trying again

### Navigating Between Windows and WSL

Your Windows files are accessible in WSL under the `/mnt/c/` directory. To navigate to your project:

```bash
cd /mnt/c/Users/User/OneDrive\ -\ UvA/Documents/FreeLanceShield
```

## Next Steps

After successful deployment:
1. Test all frontend interactions with the real contracts
2. Verify transactions on [Solana Explorer](https://explorer.solana.com/?cluster=devnet)
3. Monitor program logs with `solana logs`

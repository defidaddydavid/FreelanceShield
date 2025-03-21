# FreelanceShield Solana Contract Deployment Script for Windows
# This script helps deploy the FreelanceShield smart contracts to Solana devnet

Write-Host "===== FreelanceShield Solana Contract Deployment =====" -ForegroundColor Cyan
Write-Host "This script will help deploy your smart contracts to Solana devnet." -ForegroundColor Cyan
Write-Host ""

# Check if Solana CLI is installed
try {
    $solanaVersion = solana --version
    Write-Host "✓ Solana CLI found: $solanaVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: Solana CLI not found. Please install it first." -ForegroundColor Red
    Write-Host "Visit: https://docs.solana.com/cli/install-solana-cli-tools" -ForegroundColor Yellow
    exit 1
}

# Check if Anchor is installed
try {
    $anchorVersion = anchor --version
    Write-Host "✓ Anchor found: $anchorVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: Anchor CLI not found. Please install it first." -ForegroundColor Red
    Write-Host "Run: npm install -g @project-serum/anchor-cli" -ForegroundColor Yellow
    exit 1
}

# Create deployment wallet if it doesn't exist
$walletPath = ".\devnet-deploy.json"

if (-not (Test-Path $walletPath)) {
    Write-Host "Creating new deployment wallet..." -ForegroundColor Yellow
    solana-keygen new --no-bip39-passphrase -o $walletPath
} else {
    Write-Host "Using existing wallet at $walletPath" -ForegroundColor Green
}

# Set Solana config to use devnet
Write-Host "Configuring Solana CLI for devnet..." -ForegroundColor Yellow
solana config set --url devnet

# Set the keypair
solana config set --keypair $walletPath

# Check wallet balance
$balance = solana balance
Write-Host "Current wallet balance: $balance" -ForegroundColor Cyan

# Airdrop SOL if needed
if ($balance -lt 1) {
    Write-Host "Balance too low. Requesting airdrop..." -ForegroundColor Yellow
    solana airdrop 2
    Start-Sleep -Seconds 5
    $newBalance = solana balance
    Write-Host "New balance: $newBalance" -ForegroundColor Green
    
    # Check if airdrop worked
    if ($newBalance -le $balance) {
        $address = solana address
        Write-Host "Warning: Airdrop might have failed. Consider manually funding this wallet." -ForegroundColor Red
        Write-Host "Wallet address: $address" -ForegroundColor Yellow
        Write-Host "Visit: https://solfaucet.com/ to get devnet SOL" -ForegroundColor Yellow
    }
}

# Build the programs
Write-Host "Building programs..." -ForegroundColor Yellow
anchor build

# Deploy the programs
Write-Host "Deploying programs to devnet..." -ForegroundColor Yellow
anchor deploy --provider.cluster devnet

# Display deployed program IDs
Write-Host "Deployed program IDs:" -ForegroundColor Green
$anchorToml = Get-Content -Path .\Anchor.toml
$inDevnetSection = $false
foreach ($line in $anchorToml) {
    if ($line -match "\[programs\.devnet\]") {
        $inDevnetSection = $true
        Write-Host $line -ForegroundColor Cyan
    } elseif ($inDevnetSection -and $line -match "^$") {
        $inDevnetSection = $false
    } elseif ($inDevnetSection) {
        Write-Host $line -ForegroundColor Green
    }
}

Write-Host "===== Deployment Complete =====" -ForegroundColor Cyan
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update your frontend constants.ts file with these program IDs" -ForegroundColor Yellow
Write-Host "2. Set USE_MOCK_DATA to false in your frontend files" -ForegroundColor Yellow
Write-Host "3. Test your application with real blockchain interaction" -ForegroundColor Yellow

# Run test script if requested
$runTest = Read-Host "Would you like to run the deployment test script? (y/n)"
if ($runTest -eq "y") {
    Write-Host "Running deployment test..." -ForegroundColor Yellow
    npx ts-node test-deployment.ts
}

Write-Host "All done! Your FreelanceShield contracts are now deployed to Solana devnet." -ForegroundColor Green

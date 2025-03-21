import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { PublicKey, Connection, clusterApiUrl, LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';

// Use path.resolve for __dirname equivalent in ESM
const currentDir = __dirname || path.resolve();

// Load program IDs from Anchor.toml
function getProgramIds(): { insuranceProgram: string | null, riskPoolProgram: string | null, claimsProcessor: string | null } {
  try {
    const anchorToml = fs.readFileSync(path.join(currentDir, 'Anchor.toml'), 'utf8');
    const insuranceProgramMatch = anchorToml.match(/insurance_program\s*=\s*"([^"]+)"/);
    const riskPoolProgramMatch = anchorToml.match(/risk_pool_program\s*=\s*"([^"]+)"/);
    const claimsProcessorMatch = anchorToml.match(/claims_processor\s*=\s*"([^"]+)"/);

    return {
      insuranceProgram: insuranceProgramMatch ? insuranceProgramMatch[1] : null,
      riskPoolProgram: riskPoolProgramMatch ? riskPoolProgramMatch[1] : null,
      claimsProcessor: claimsProcessorMatch ? claimsProcessorMatch[1] : null,
    };
  } catch (error) {
    console.error('Error reading Anchor.toml:', error);
    return { insuranceProgram: null, riskPoolProgram: null, claimsProcessor: null };
  }
}

async function main() {
  console.log('🚀 Starting FreelanceShield deployment test script...');
  
  // Initialize connection to devnet
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
  console.log('Connected to Solana devnet');
  
  // Get program IDs from Anchor.toml
  const programIds = getProgramIds();
  
  if (!programIds.insuranceProgram || !programIds.riskPoolProgram || !programIds.claimsProcessor) {
    console.error('❌ Failed to load program IDs from Anchor.toml');
    return;
  }
  
  console.log('📋 Program IDs loaded from Anchor.toml:');
  console.log(`Insurance Program: ${programIds.insuranceProgram}`);
  console.log(`Risk Pool Program: ${programIds.riskPoolProgram}`);
  console.log(`Claims Processor: ${programIds.claimsProcessor}`);
  
  // Check if programs exist on devnet
  try {
    console.log('\n🔍 Verifying programs on devnet...');
    
    for (const [name, id] of Object.entries(programIds)) {
      if (!id) continue;
      
      try {
        const programId = new PublicKey(id);
        const accountInfo = await connection.getAccountInfo(programId);
        
        if (accountInfo) {
          console.log(`✅ ${name}: Program found on devnet (${id})`);
          console.log(`   Data Length: ${accountInfo.data.length} bytes`);
          console.log(`   Executable: ${accountInfo.executable}`);
          console.log(`   Owner: ${accountInfo.owner.toString()}`);
        } else {
          console.error(`❌ ${name}: Program NOT found on devnet (${id})`);
        }
      } catch (error) {
        console.error(`❌ Error checking ${name}:`, error);
      }
    }
    
    // Get wallet balance
    const walletPath = path.join(currentDir, 'devnet-deploy.json');
    if (fs.existsSync(walletPath)) {
      const keypair = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
      const wallet = anchor.web3.Keypair.fromSecretKey(new Uint8Array(keypair));
      const balance = await connection.getBalance(wallet.publicKey);
      
      console.log('\n💰 Deployment Wallet:');
      console.log(`Address: ${wallet.publicKey.toString()}`);
      console.log(`Balance: ${balance / LAMPORTS_PER_SOL} SOL`);
    } else {
      console.log('\n⚠️ Deployment wallet file not found at:', walletPath);
    }
    
    console.log('\n🔄 Testing program interactions...');
    console.log('This would require initializing the anchor Program objects and making RPC calls.');
    console.log('For a complete test, implement specific program interactions here.');
    
  } catch (error) {
    console.error('❌ Error during deployment test:', error);
  }
  
  console.log('\n✨ Deployment test completed');
}

main().catch(error => {
  console.error('Unhandled error:', error);
});

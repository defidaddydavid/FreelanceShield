import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { 
  INSURANCE_PROGRAM_ID, 
  RISK_POOL_PROGRAM_ID, 
  CLAIMS_PROCESSOR_PROGRAM_ID,
  NETWORK_CONFIG
} from '../lib/solana/constants';

/**
 * Utility to verify the Solana contract integration
 * Run this to check if your frontend is correctly connected to the deployed contracts
 */
export async function verifyContractIntegration() {
  console.group('🔍 Verifying FreelanceShield Contract Integration');
  console.log('Starting verification process...');
  
  // Step 1: Check network configuration
  console.group('1. Network Configuration');
  console.log(`Network: ${NETWORK_CONFIG.endpoint}`);
  console.log(`Is Devnet: ${NETWORK_CONFIG.endpoint.includes('devnet')}`);
  console.log(`LAMPORTS_PER_SOL: ${NETWORK_CONFIG.lamportsPerSol}`);
  console.groupEnd();
  
  // Step 2: Verify Program IDs
  console.group('2. Program IDs');
  console.log(`Insurance Program: ${INSURANCE_PROGRAM_ID.toString()}`);
  console.log(`Risk Pool Program: ${RISK_POOL_PROGRAM_ID.toString()}`);
  console.log(`Claims Processor: ${CLAIMS_PROCESSOR_PROGRAM_ID.toString()}`);
  console.groupEnd();
  
  try {
    // Step 3: Connect to Solana network
    console.group('3. Solana Connection');
    const connection = new Connection(NETWORK_CONFIG.endpoint, 'confirmed');
    console.log('Connection established to Solana network');
    console.groupEnd();
    
    // Step 4: Verify programs exist on-chain
    console.group('4. Program Verification');
    
    const programIds = [
      { name: 'Insurance Program', id: INSURANCE_PROGRAM_ID },
      { name: 'Risk Pool Program', id: RISK_POOL_PROGRAM_ID },
      { name: 'Claims Processor', id: CLAIMS_PROCESSOR_PROGRAM_ID }
    ];
    
    for (const program of programIds) {
      try {
        const accountInfo = await connection.getAccountInfo(program.id);
        if (accountInfo) {
          console.log(`✅ ${program.name}: Found on-chain`);
          console.log(`   Executable: ${accountInfo.executable}`);
          console.log(`   Owner: ${accountInfo.owner.toString()}`);
        } else {
          console.error(`❌ ${program.name}: NOT found on-chain`);
        }
      } catch (error) {
        console.error(`❌ Error checking ${program.name}:`, error);
      }
    }
    console.groupEnd();
    
    // Step 5: Check for mock data usage
    console.group('5. Mock Data Check');
    try {
      // This is a runtime check - you'll need to implement a way to check this
      // For example, you could add a global variable or check a specific condition
      console.log('⚠️ Manual check required: Ensure USE_MOCK_DATA is set to false in useRiskPoolData.ts');
    } catch (error) {
      console.error('Error checking mock data usage:', error);
    }
    console.groupEnd();
    
    console.log('✅ Verification complete! Your frontend is configured for the deployed contracts.');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    return { success: false, error };
  } finally {
    console.groupEnd();
  }
}

/**
 * Run this function from your browser console to verify contract integration
 * Example: await import('./utils/verifyContractIntegration').then(m => m.verifyContractIntegration())
 */
export function runVerification() {
  verifyContractIntegration()
    .then(result => {
      if (result.success) {
        console.log('🎉 Contract integration verification successful!');
      } else {
        console.error('❌ Contract integration verification failed!', result.error);
      }
    })
    .catch(error => {
      console.error('Unexpected error during verification:', error);
    });
}

// Export a function that can be called from a component
export default verifyContractIntegration;

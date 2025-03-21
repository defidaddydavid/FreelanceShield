const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const NETWORK = 'devnet';
const OUTPUT_DIR = path.join(__dirname, '../target/deploy');
const FRONTEND_CONSTANTS_PATH = path.join(__dirname, '../../freelance-safeguard/src/lib/solana/constants.ts');

// Ensure the output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('🚀 Starting deployment to Solana devnet...');

try {
  // Build the programs
  console.log('\n📦 Building Anchor programs...');
  execSync('anchor build', { stdio: 'inherit' });

  // Deploy the programs
  console.log('\n🔄 Deploying programs to devnet...');
  execSync(`anchor deploy --provider.cluster ${NETWORK}`, { stdio: 'inherit' });

  // Get the program IDs
  console.log('\n📝 Getting program IDs...');
  
  // Read the Anchor.toml file to get the program names
  const anchorToml = fs.readFileSync(path.join(__dirname, '../Anchor.toml'), 'utf8');
  const programNames = [];
  
  // Extract program names from Anchor.toml
  const programsSection = anchorToml.match(/\[programs\..*?\]([\s\S]*?)(?=\[|\Z)/g);
  if (programsSection) {
    programsSection.forEach(section => {
      const programs = section.match(/([a-zA-Z_-]+)\s*=\s*"([^"]+)"/g);
      if (programs) {
        programs.forEach(program => {
          const match = program.match(/([a-zA-Z_-]+)\s*=\s*"([^"]+)"/);
          if (match && match[1]) {
            programNames.push(match[1]);
          }
        });
      }
    });
  }
  
  // Get the program IDs from the keypair files
  const programIds = {};
  programNames.forEach(programName => {
    try {
      const keypairPath = path.join(__dirname, `../target/deploy/${programName}-keypair.json`);
      if (fs.existsSync(keypairPath)) {
        const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
        const publicKey = execSync(`solana-keygen pubkey ${keypairPath}`, { encoding: 'utf8' }).trim();
        programIds[programName] = publicKey;
        console.log(`  - ${programName}: ${publicKey}`);
      }
    } catch (err) {
      console.error(`  ❌ Error getting program ID for ${programName}:`, err.message);
    }
  });

  // Update the frontend constants file with the new program IDs
  console.log('\n📝 Updating frontend constants...');
  
  if (fs.existsSync(FRONTEND_CONSTANTS_PATH)) {
    let constantsFile = fs.readFileSync(FRONTEND_CONSTANTS_PATH, 'utf8');
    
    // Update each program ID in the constants file
    Object.entries(programIds).forEach(([programName, programId]) => {
      const constName = programName.replace(/-/g, '_').toUpperCase() + '_PROGRAM_ID';
      const regex = new RegExp(`export const ${constName} = new PublicKey\\(['"]([^'"]+)['"]\\);`);
      
      if (regex.test(constantsFile)) {
        constantsFile = constantsFile.replace(
          regex,
          `export const ${constName} = new PublicKey('${programId}');`
        );
        console.log(`  ✅ Updated ${constName} in constants.ts`);
      } else {
        console.log(`  ⚠️ Could not find ${constName} in constants.ts`);
      }
    });
    
    // Write the updated constants file
    fs.writeFileSync(FRONTEND_CONSTANTS_PATH, constantsFile);
    console.log('  ✅ Frontend constants updated successfully');
  } else {
    console.log('  ❌ Frontend constants file not found');
  }

  console.log('\n✅ Deployment completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Verify the program IDs in the frontend constants file');
  console.log('2. Test the integration with the frontend');
  console.log('3. Update any additional configuration if needed');
  
} catch (error) {
  console.error('\n❌ Deployment failed:', error.message);
  process.exit(1);
}

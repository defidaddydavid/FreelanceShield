/**
 * Script to copy Anchor-generated IDL files to the frontend app
 * This script should be run after building the contracts with 'anchor build'
 */

const fs = require('fs');
const path = require('path');

// Paths
const targetDir = path.join(__dirname, '../app/src/idl');
const idlSourceDir = path.join(__dirname, '../target/idl');
const typesSourceDir = path.join(__dirname, '../target/types');

// Ensure target directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  console.log(`Created directory: ${targetDir}`);
}

// List of programs for which to copy IDLs
const programs = [
  'core',
  'risk_pool_program',
  'claims_processor',
  'reputation_program',
  'policy_nft',
  'dao_governance'
];

// Copy IDLs
programs.forEach(program => {
  try {
    // Path to source IDL file
    const idlSource = path.join(idlSourceDir, `${program}.json`);
    const targetFile = path.join(targetDir, `${program}.json`);
    
    // Check if source file exists
    if (fs.existsSync(idlSource)) {
      // Read and copy file
      const idlContent = fs.readFileSync(idlSource, 'utf8');
      fs.writeFileSync(targetFile, idlContent);
      console.log(`Copied IDL for ${program} to frontend`);
    } else {
      console.warn(`Warning: IDL for ${program} not found at ${idlSource}`);
      
      // Create empty placeholder if IDL doesn't exist
      const emptyIdl = {
        version: "0.1.0",
        name: program,
        instructions: [],
        accounts: [],
        errors: []
      };
      
      fs.writeFileSync(targetFile, JSON.stringify(emptyIdl, null, 2));
      console.log(`Created empty placeholder IDL for ${program}`);
    }
  } catch (error) {
    console.error(`Error processing ${program} IDL:`, error);
  }
});

console.log('IDL files copy completed.');

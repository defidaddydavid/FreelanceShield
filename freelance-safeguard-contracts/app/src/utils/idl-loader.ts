import { Idl } from '@project-serum/anchor';

/**
 * IDL loader utility for FreelanceShield contracts
 * Dynamically loads IDL files for Anchor programs
 */

// IDL type definition
export interface ProgramIdls {
  core: Idl;
  riskPool: Idl;
  claimsProcessor: Idl;
  reputation: Idl;
  policyNft: Idl;
}

// Default empty IDLs for initialization
const emptyIdl: Idl = {
  version: "0.1.0",
  name: "empty",
  instructions: [],
  accounts: [],
  errors: []
};

// Initial state
const initialIdls: ProgramIdls = {
  core: emptyIdl,
  riskPool: emptyIdl,
  claimsProcessor: emptyIdl,
  reputation: emptyIdl,
  policyNft: emptyIdl
};

// Private variable to hold loaded IDLs
let loadedIdls = { ...initialIdls };
let isLoaded = false;

/**
 * Load all IDLs asynchronously
 */
export async function loadAllIdls(): Promise<ProgramIdls> {
  if (isLoaded) {
    return loadedIdls;
  }

  try {
    // Load all IDLs in parallel
    const [coreIdl, riskPoolIdl, claimsProcessorIdl, reputationIdl, policyNftIdl] = await Promise.all([
      loadIdl('core'),
      loadIdl('risk_pool_program'),
      loadIdl('claims_processor'),
      loadIdl('reputation_program'),
      loadIdl('policy_nft')
    ]);

    // Update loaded IDLs
    loadedIdls = {
      core: coreIdl,
      riskPool: riskPoolIdl,
      claimsProcessor: claimsProcessorIdl,
      reputation: reputationIdl,
      policyNft: policyNftIdl
    };

    isLoaded = true;
    return loadedIdls;
  } catch (error) {
    console.error('Error loading IDLs:', error);
    throw error;
  }
}

/**
 * Load a specific IDL file
 */
async function loadIdl(programName: string): Promise<Idl> {
  try {
    // In production, load from a dynamic import
    // For dev, we'll use a simplified approach
    const idl = await import(`../idl/${programName}.json`);
    return idl.default as Idl;
  } catch (error) {
    console.error(`Error loading ${programName} IDL:`, error);
    // Return empty IDL for graceful degradation
    return emptyIdl;
  }
}

/**
 * Get all loaded IDLs
 */
export function getIdls(): ProgramIdls {
  return loadedIdls;
}

/**
 * Get a specific IDL
 */
export function getIdl(program: keyof ProgramIdls): Idl {
  return loadedIdls[program];
}

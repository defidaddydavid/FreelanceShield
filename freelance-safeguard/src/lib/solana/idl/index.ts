import insuranceProgramIdl from './insurance_program.json';
import reputationProgramIdl from './reputation_program.json';
import stakingProgramIdl from './staking_program.json';

// Export all IDLs for easy import
export {
  insuranceProgramIdl,
  reputationProgramIdl,
  stakingProgramIdl
};

// Export types for TypeScript
export type InsuranceProgramIDL = typeof insuranceProgramIdl;
export type ReputationProgramIDL = typeof reputationProgramIdl;
export type StakingProgramIDL = typeof stakingProgramIdl;

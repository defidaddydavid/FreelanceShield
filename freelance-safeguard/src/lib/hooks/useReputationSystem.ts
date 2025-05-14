import { FEATURES } from '@/lib/featureFlags';
import { useReputationProgram } from '@/lib/solana/hooks/useReputationProgram';
import { useEthosReputation } from '@/lib/ethos/useEthosReputation';

/**
 * A unified hook that provides access to the reputation system
 * 
 * This hook will use either the original Solana-based reputation system
 * or the new Ethos-based system depending on the feature flag
 */
export function useReputationSystem() {
  // Use Ethos if feature flag is enabled, otherwise use the original system
  return FEATURES.USE_ETHOS_REPUTATION 
    ? useEthosReputation() 
    : useReputationProgram();
}

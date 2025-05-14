/**
 * Feature flags to control the rollout of new features
 * 
 * These can be controlled via environment variables in production
 * or directly modified during development
 */

export const FEATURES = {
  // Controls whether to use Ethos for reputation scoring instead of the Solana-based system
  USE_ETHOS_REPUTATION: process.env.NEXT_PUBLIC_USE_ETHOS_REPUTATION === 'true'
};

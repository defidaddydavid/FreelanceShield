import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Star, Check, X, BarChart3, Award, Hexagon } from 'lucide-react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  ReputationService,
  ReputationDimension,
  ReputationSource,
  createReputationService
} from '@/services/reputationService';

// Program ID for the reputation program
const REPUTATION_PROGRAM_ID = 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS';

// Define dimension display properties
const dimensionInfo = {
  [ReputationDimension.COMPLETED_WORK]: {
    label: 'Completed Work',
    description: 'Successfully completed projects and contracts',
    icon: <Check className="w-4 h-4" />,
    color: 'from-[#00FFFF] to-[#14F195]'
  },
  [ReputationDimension.DISPUTE_RESOLUTION]: {
    label: 'Dispute Resolution',
    description: 'Fair handling of disagreements and conflicts',
    icon: <Shield className="w-4 h-4" />,
    color: 'from-[#9945FF] to-[#14F195]'
  },
  [ReputationDimension.PAYMENT_HISTORY]: {
    label: 'Payment History',
    description: 'Timely payments and financial reliability',
    icon: <BarChart3 className="w-4 h-4" />,
    color: 'from-[#F91379] to-[#9945FF]'
  },
  [ReputationDimension.CLAIM_HISTORY]: {
    label: 'Claim History',
    description: 'Fair and accurate insurance claims',
    icon: <Shield className="w-4 h-4" />,
    color: 'from-[#14F195] to-[#00FFFF]'
  },
  [ReputationDimension.COMMUNITY_PARTICIPATION]: {
    label: 'Community Participation',
    description: 'Active contributions to protocol governance',
    icon: <Hexagon className="w-4 h-4" />,
    color: 'from-[#9945FF] to-[#F91379]'
  }
};

// Define source display properties
const sourceInfo = {
  [ReputationSource.FREELANCESHIELD]: {
    label: 'FreelanceShield',
    description: 'Activity and metrics from FreelanceShield protocol',
    icon: <Shield className="w-4 h-4" />,
    color: 'from-[#9945FF] to-[#00FFFF]',
    weight: '65%'
  },
  [ReputationSource.COLONY]: {
    label: 'Colony',
    description: 'Reputation imported from Colony (Ethereum)',
    icon: <Hexagon className="w-4 h-4" />,
    color: 'from-[#F91379] to-[#9945FF]',
    weight: '20%'
  },
  [ReputationSource.BRAINTRUST]: {
    label: 'Braintrust',
    description: 'Reputation imported from Braintrust (Solana)',
    icon: <Award className="w-4 h-4" />,
    color: 'from-[#00FFFF] to-[#14F195]',
    weight: '15%'
  }
};

interface ReputationScoreProps {
  className?: string;
}

export const ReputationScore: React.FC<ReputationScoreProps> = ({ className }) => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [ethereumAddress, setEthereumAddress] = useState('');
  const [reputationService, setReputationService] = useState<ReputationService | null>(null);
  const [reputationProfile, setReputationProfile] = useState<any>(null);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  
  useEffect(() => {
    if (connection) {
      const service = createReputationService(connection, REPUTATION_PROGRAM_ID);
      setReputationService(service);
    }
  }, [connection]);
  
  useEffect(() => {
    if (reputationService && publicKey) {
      loadReputationData();
    }
  }, [reputationService, publicKey]);
  
  const loadReputationData = async () => {
    if (!reputationService || !publicKey) return;
    
    try {
      setIsLoading(true);
      const profile = await reputationService.getReputationProfile(
        publicKey.toString(), 
        ethereumAddress || undefined
      );
      
      setReputationProfile(profile);
      const discount = reputationService.calculatePremiumDiscount(profile.totalScore);
      setDiscountPercentage(discount);
    } catch (error) {
      console.error('Error loading reputation data:', error);
      toast.error('Failed to load reputation data');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleImportColony = async () => {
    if (!ethereumAddress) {
      toast.error('Please enter your Ethereum address');
      return;
    }
    
    try {
      setIsLoading(true);
      toast.info('Importing reputation from Colony...');
      
      // Validate Ethereum address
      const ethRegex = /^0x[a-fA-F0-9]{40}$/;
      if (!ethRegex.test(ethereumAddress)) {
        toast.error('Invalid Ethereum address format');
        return;
      }
      
      // Import reputation
      if (reputationService && publicKey) {
        const profile = await reputationService.getReputationProfile(
          publicKey.toString(),
          ethereumAddress
        );
        
        setReputationProfile(profile);
        const discount = reputationService.calculatePremiumDiscount(profile.totalScore);
        setDiscountPercentage(discount);
        
        toast.success('Successfully imported Colony reputation');
      }
    } catch (error) {
      console.error('Error importing Colony reputation:', error);
      toast.error('Failed to import reputation from Colony');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleImportBraintrust = async () => {
    if (!publicKey) {
      toast.error('Please connect your wallet');
      return;
    }
    
    try {
      setIsLoading(true);
      toast.info('Importing reputation from Braintrust...');
      
      // Import reputation
      if (reputationService && publicKey) {
        const profile = await reputationService.getReputationProfile(
          publicKey.toString(),
          ethereumAddress || undefined
        );
        
        setReputationProfile(profile);
        const discount = reputationService.calculatePremiumDiscount(profile.totalScore);
        setDiscountPercentage(discount);
        
        toast.success('Successfully imported Braintrust reputation');
      }
    } catch (error) {
      console.error('Error importing Braintrust reputation:', error);
      toast.error('Failed to import reputation from Braintrust');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format score as a percentage with 2 decimal places
  const formatScore = (score: number): string => {
    return (score * 100).toFixed(2) + '%';
  };
  
  if (!publicKey) {
    return (
      <div className={cn("p-6 rounded-lg bg-black/60 backdrop-blur-sm border border-[#9945FF]/20", className)}>
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Shield className="w-10 h-10 mb-4 text-[#9945FF]" />
          <h3 className="font-heading text-xl text-white mb-2">Connect Your Wallet</h3>
          <p className="text-gray-400 max-w-md">
            Connect your wallet to view your reputation score and import external data.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={cn("rounded-lg overflow-hidden", className)}>
      <div className="p-[1px] rounded-lg bg-gradient-to-r from-[#9945FF] via-[#00FFFF] to-[#9945FF]">
        <div className="p-6 rounded-lg bg-black/80 backdrop-blur-sm border border-[#9945FF]/10">
          {/* Header */}
          <div className="flex flex-col items-center md:flex-row md:justify-between gap-4 mb-6">
            <div>
              <h2 className="font-heading text-2xl text-white mb-1">Reputation Score</h2>
              <p className="text-gray-400 text-sm">
                Cross-platform reputation aggregator powered by Solana
              </p>
            </div>
            
            {reputationProfile && (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center"
              >
                <div className="p-[1px] rounded-full bg-gradient-to-r from-[#9945FF] to-[#00FFFF]">
                  <div className="flex items-center justify-center w-24 h-24 rounded-full bg-black text-center p-4">
                    <div>
                      <div className="font-heading text-2xl text-white">
                        {(reputationProfile.totalScore * 100).toFixed(0)}
                      </div>
                      <div className="text-xs text-gray-400">Score</div>
                    </div>
                  </div>
                </div>
                {discountPercentage > 0 && (
                  <div className="ml-3 p-2 rounded-md bg-[#14F195]/10 border border-[#14F195]/20">
                    <div className="text-xs text-gray-400">Premium Discount</div>
                    <div className="font-heading text-lg text-[#14F195]">
                      {discountPercentage}%
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-10 h-10 border-4 border-[#9945FF]/30 border-t-[#9945FF] rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {reputationProfile ? (
                <div className="space-y-8">
                  {/* Dimension Scores */}
                  <div>
                    <h3 className="font-heading text-white text-lg mb-3">Reputation Dimensions</h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {Object.values(ReputationDimension).map((dimension) => {
                        const score = reputationProfile.dimensionScores[dimension] || 0;
                        const info = dimensionInfo[dimension];
                        return (
                          <motion.div 
                            key={dimension}
                            whileHover={{ scale: 1.02 }}
                            className="p-4 rounded-md bg-black/60 border border-[#9945FF]/10"
                          >
                            <div className="flex items-start mb-2">
                              <div className={`p-2 rounded-md bg-gradient-to-r ${info.color} mr-3`}>
                                {info.icon}
                              </div>
                              <div>
                                <h4 className="font-heading text-white text-sm">{info.label}</h4>
                                <p className="text-gray-400 text-xs">{info.description}</p>
                              </div>
                            </div>
                            <div className="mt-2">
                              <div className="flex justify-between text-xs text-gray-400 mb-1">
                                <span>Score</span>
                                <span>{formatScore(score)}</span>
                              </div>
                              <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${score * 100}%` }}
                                  transition={{ duration: 1 }}
                                  className={`h-full bg-gradient-to-r ${info.color}`}
                                />
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Source Scores */}
                  <div>
                    <h3 className="font-heading text-white text-lg mb-3">Reputation Sources</h3>
                    <div className="grid gap-4 md:grid-cols-3">
                      {Object.values(ReputationSource).map((source) => {
                        const score = reputationProfile.sourceScores[source] || 0;
                        const info = sourceInfo[source];
                        return (
                          <motion.div 
                            key={source}
                            whileHover={{ scale: 1.02 }}
                            className="p-4 rounded-md bg-black/60 border border-[#9945FF]/10"
                          >
                            <div className="flex items-start mb-2">
                              <div className={`p-2 rounded-md bg-gradient-to-r ${info.color} mr-3`}>
                                {info.icon}
                              </div>
                              <div>
                                <h4 className="font-heading text-white text-sm">{info.label}</h4>
                                <p className="text-gray-400 text-xs">Weight: {info.weight}</p>
                              </div>
                            </div>
                            <div className="mt-2">
                              <div className="flex justify-between text-xs text-gray-400 mb-1">
                                <span>Score</span>
                                <span>{formatScore(score)}</span>
                              </div>
                              <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${score * 100}%` }}
                                  transition={{ duration: 1 }}
                                  className={`h-full bg-gradient-to-r ${info.color}`}
                                />
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-[#9945FF] mx-auto mb-4" />
                  <h3 className="font-heading text-xl text-white mb-2">No Reputation Data Yet</h3>
                  <p className="text-gray-400 max-w-md mx-auto mb-6">
                    Start building your reputation by using FreelanceShield or import your reputation from other platforms.
                  </p>
                  <Button
                    onClick={loadReputationData}
                    className="bg-gradient-to-r from-[#9945FF] to-[#00FFFF] text-white hover:opacity-90"
                  >
                    Initialize Reputation
                  </Button>
                </div>
              )}
              
              {/* Import External Reputation */}
              <div className="mt-8 p-5 rounded-md bg-black/40 border border-[#9945FF]/10">
                <h3 className="font-heading text-white text-lg mb-4">Import External Reputation</h3>
                
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Colony Import */}
                  <div className="p-4 rounded-md bg-black/60 border border-[#9945FF]/20">
                    <div className="flex items-center mb-3">
                      <Hexagon className="w-5 h-5 text-[#F91379] mr-2" />
                      <h4 className="font-heading text-white">Colony (Ethereum)</h4>
                    </div>
                    <p className="text-gray-400 text-sm mb-4">
                      Import your reputation from Colony's Ethereum-based system.
                    </p>
                    
                    <div className="space-y-3">
                      <Input
                        type="text"
                        value={ethereumAddress}
                        onChange={(e) => setEthereumAddress(e.target.value)}
                        placeholder="Enter Ethereum Address (0x...)"
                        className="bg-black/50 border border-[#9945FF]/20 text-white"
                      />
                      
                      <Button
                        onClick={handleImportColony}
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-[#F91379] to-[#9945FF] text-white hover:opacity-90"
                      >
                        Import from Colony
                      </Button>
                    </div>
                  </div>
                  
                  {/* Braintrust Import */}
                  <div className="p-4 rounded-md bg-black/60 border border-[#00FFFF]/20">
                    <div className="flex items-center mb-3">
                      <Award className="w-5 h-5 text-[#00FFFF] mr-2" />
                      <h4 className="font-heading text-white">Braintrust (Solana)</h4>
                    </div>
                    <p className="text-gray-400 text-sm mb-4">
                      Import your reputation from Braintrust's Solana-based system.
                    </p>
                    
                    <div className="space-y-3">
                      <p className="text-xs text-gray-500">
                        We'll use your connected wallet to fetch reputation:
                        <span className="text-gray-400 break-all ml-1">
                          {publicKey.toString()}
                        </span>
                      </p>
                      
                      <Button
                        onClick={handleImportBraintrust}
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-[#00FFFF] to-[#14F195] text-white hover:opacity-90"
                      >
                        Import from Braintrust
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

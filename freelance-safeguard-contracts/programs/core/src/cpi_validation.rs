use anchor_lang::prelude::*;
use std::convert::TryFrom;

/// Utility module for validating cross-program invocations between FreelanceShield programs
/// This ensures that only authorized programs can call protected functions

/// Program IDs for FreelanceShield protocols
#[derive(Clone, Debug, PartialEq)]
pub enum FreelanceShieldProgram {
    Core,
    RiskPool,
    ClaimsProcessor,
    StakingProgram,
    ReputationProgram,
    PolicyNft,
    EscrowProgram,
    DaoGovernance,
    EnhancedCover,
    Unknown,
}

impl FreelanceShieldProgram {
    /// Check if program ID belongs to FreelanceShield ecosystem
    pub fn is_freelance_shield_program(program_id: &Pubkey) -> bool {
        Self::try_from(*program_id) != Self::Unknown
    }
    
    /// Validate that caller is an authorized FreelanceShield program
    pub fn validate_program_caller<'info>(
        program_info: &AccountInfo<'info>,
        allowed_programs: &[FreelanceShieldProgram],
    ) -> Result<()> {
        let caller_program = Self::try_from(*program_info.key);
        
        // Check if caller is in the list of allowed programs
        if allowed_programs.contains(&caller_program) {
            Ok(())
        } else {
            Err(error!(ErrorCode::UnauthorizedProgramCaller))
        }
    }
}

impl TryFrom<Pubkey> for FreelanceShieldProgram {
    type Error = ();
    
    fn try_from(pubkey: Pubkey) -> Self {
        // Note: In production, these would be actual on-chain program IDs
        // For development, we're using placeholders that should be updated
        // with deployed program IDs
        
        // Core program ID
        if pubkey.to_string() == "CoreProgID111111111111111111111111111111111111" {
            return Self::Core;
        }
        
        // Risk pool program ID
        if pubkey.to_string() == "FroU966kfvu5RAQxhLfb4mhFdDjY6JewEf41ZfYR3xhm" {
            return Self::RiskPool;
        }
        
        // Claims processor ID
        if pubkey.to_string() == "CL1MSPrcsr111111111111111111111111111111111" {
            return Self::ClaimsProcessor;
        }
        
        // Staking program ID
        if pubkey.to_string() == "StakingProg1111111111111111111111111111111111" {
            return Self::StakingProgram;
        }
        
        // Reputation program ID
        if pubkey.to_string() == "9KbeVQ7mhcYSDUnQ9jcVpEeQx7uu1xJfqvKrQsfpaqEq" {
            return Self::ReputationProgram;
        }
        
        // Policy NFT program ID
        if pubkey.to_string() == "PolicyNFT11111111111111111111111111111111111" {
            return Self::PolicyNft;
        }
        
        // Escrow program ID
        if pubkey.to_string() == "EscrowProg1111111111111111111111111111111111" {
            return Self::EscrowProgram;
        }
        
        // DAO Governance program ID
        if pubkey.to_string() == "FDJJ1NSYbLe3v1wCVGXcrA1hqKvf2BbpbNXE3G6TSuf7" {
            return Self::DaoGovernance;
        }
        
        // Enhanced Cover program ID
        if pubkey.to_string() == "EnhancedCvr111111111111111111111111111111111" {
            return Self::EnhancedCover;
        }
        
        Self::Unknown
    }
}

#[error_code]
pub enum ErrorCode {
    #[msg("Caller is not an authorized FreelanceShield program")]
    UnauthorizedProgramCaller,
}

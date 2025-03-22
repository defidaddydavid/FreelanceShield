use anchor_lang::prelude::*;
use super::constants::*;

/// Premium calculation components stored for transparency and auditability
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct PremiumBreakdown {
    /// Base rate used in calculation (in lamports)
    pub base_rate: u64,
    
    /// Coverage factor used in calculation
    pub coverage_factor: u64,
    
    /// Period factor used in calculation
    pub period_factor: u64,
    
    /// Risk weight used in calculation
    pub risk_weight: u64,
    
    /// Reputation multiplier used in calculation
    pub reputation_multiplier: u64,
    
    /// Market adjustment used in calculation
    pub market_adjustment: u64,
}

#[account]
pub struct Policy {
    pub owner: Pubkey,
    pub coverage_amount: u64,
    pub premium_amount: u64,
    pub start_date: i64,
    pub end_date: i64,
    pub status: PolicyStatus,
    pub job_type: JobType,
    pub industry: Industry,
    pub claims_count: u8,
    pub risk_score: u8,
    
    /// Premium calculation breakdown for transparency and auditability
    pub premium_breakdown: PremiumBreakdown,
    
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum PolicyStatus {
    Active,
    Expired,
    Cancelled,
    Claimed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum JobType {
    SoftwareDevelopment,
    Design,
    Writing,
    Marketing,
    Consulting,
    Other,
}

impl JobType {
    pub fn from_u8(value: u8) -> Result<Self> {
        match value {
            0 => Ok(JobType::SoftwareDevelopment),
            1 => Ok(JobType::Design),
            2 => Ok(JobType::Writing),
            3 => Ok(JobType::Marketing),
            4 => Ok(JobType::Consulting),
            5 => Ok(JobType::Other),
            _ => Err(error!(ErrorCode::InvalidJobType)),
        }
    }
    
    pub fn to_u8(&self) -> u8 {
        match self {
            JobType::SoftwareDevelopment => 0,
            JobType::Design => 1,
            JobType::Writing => 2,
            JobType::Marketing => 3,
            JobType::Consulting => 4,
            JobType::Other => 5,
        }
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum Industry {
    Technology,
    Healthcare,
    Finance,
    Education,
    Retail,
    Entertainment,
    Other,
}

impl Industry {
    pub fn from_u8(value: u8) -> Result<Self> {
        match value {
            0 => Ok(Industry::Technology),
            1 => Ok(Industry::Healthcare),
            2 => Ok(Industry::Finance),
            3 => Ok(Industry::Education),
            4 => Ok(Industry::Retail),
            5 => Ok(Industry::Entertainment),
            6 => Ok(Industry::Other),
            _ => Err(error!(ErrorCode::InvalidIndustry)),
        }
    }
    
    pub fn to_u8(&self) -> u8 {
        match self {
            Industry::Technology => 0,
            Industry::Healthcare => 1,
            Industry::Finance => 2,
            Industry::Education => 3,
            Industry::Retail => 4,
            Industry::Entertainment => 5,
            Industry::Other => 6,
        }
    }
}

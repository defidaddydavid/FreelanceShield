use anchor_lang::prelude::*;

/// Insurance product types
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Copy, Debug)]
pub enum ProductType {
    /// General purpose freelance work insurance
    General,
    /// Software development specific insurance
    SoftwareDevelopment,
    /// Design work insurance
    Design,
    /// Writing and content creation insurance
    Content,
    /// Marketing work insurance
    Marketing,
    /// Consulting services insurance
    Consulting,
    /// Custom type with special terms
    Custom,
}

impl Default for ProductType {
    fn default() -> Self {
        ProductType::General
    }
}

/// Policy status
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Copy, Debug)]
pub enum PolicyStatus {
    /// Policy is active
    Active,
    /// Policy has expired
    Expired,
    /// Policy was cancelled
    Cancelled,
    /// Policy has a pending claim
    ClaimPending,
    /// Policy has paid claim
    ClaimPaid,
    /// Policy claim was rejected
    ClaimRejected,
    /// Policy is in grace period
    GracePeriod,
}

impl Default for PolicyStatus {
    fn default() -> Self {
        PolicyStatus::Active
    }
}

/// Job types for risk calculation
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Copy, Debug)]
pub enum JobType {
    /// Software development
    SoftwareDevelopment,
    /// Design work
    Design,
    /// Content writing
    ContentWriting,
    /// Digital marketing
    DigitalMarketing,
    /// Consulting services
    Consulting,
    /// Other job types
    Other,
}

impl Default for JobType {
    fn default() -> Self {
        JobType::SoftwareDevelopment
    }
}

impl JobType {
    /// Get risk weight for job type
    pub fn risk_weight(&self, weights: &[u8; 6]) -> u8 {
        weights[self.as_index()]
    }
    
    /// Convert to array index
    pub fn as_index(&self) -> usize {
        match *self {
            JobType::SoftwareDevelopment => 0,
            JobType::Design => 1,
            JobType::ContentWriting => 2,
            JobType::DigitalMarketing => 3,
            JobType::Consulting => 4,
            JobType::Other => 5,
        }
    }
}

/// Industries for risk calculation
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Copy, Debug)]
pub enum Industry {
    /// Technology sector
    Technology,
    /// Finance sector
    Finance,
    /// Healthcare sector
    Healthcare,
    /// E-commerce sector
    Ecommerce,
    /// Entertainment sector
    Entertainment,
    /// Education sector
    Education,
    /// Other industries
    Other,
}

impl Default for Industry {
    fn default() -> Self {
        Industry::Technology
    }
}

impl Industry {
    /// Get risk weight for industry
    pub fn risk_weight(&self, weights: &[u8; 7]) -> u8 {
        weights[self.as_index()]
    }
    
    /// Convert to array index
    pub fn as_index(&self) -> usize {
        match *self {
            Industry::Technology => 0,
            Industry::Finance => 1,
            Industry::Healthcare => 2,
            Industry::Ecommerce => 3,
            Industry::Entertainment => 4,
            Industry::Education => 5,
            Industry::Other => 6,
        }
    }
}

/// Claim status
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Copy, Debug)]
pub enum ClaimStatus {
    /// Claim just submitted, initial state
    Pending,
    /// Claim is waiting for votes
    PendingVote,
    /// Claim is under manual review
    UnderReview,
    /// Claim has been approved
    Approved,
    /// Claim has been rejected
    Rejected,
    /// Claim is under dispute
    Disputed,
    /// Claim has been paid out
    Paid,
    /// Claim is in arbitration
    InArbitration,
    /// Claim processing expired
    Expired,
}

impl Default for ClaimStatus {
    fn default() -> Self {
        ClaimStatus::Pending
    }
}

/// Claim categories
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Copy, Debug)]
pub enum ClaimCategory {
    /// Contract breach by client
    ContractBreach,
    /// Non-payment by client
    NonPayment,
    /// Project cancellation
    ProjectCancellation,
    /// Scope creep
    ScopeCreep,
    /// Intellectual property dispute
    IPDispute,
    /// Client dissatisfaction
    ClientDissatisfaction,
    /// Force majeure
    ForceMajeure,
    /// Other categories
    Other,
}

impl Default for ClaimCategory {
    fn default() -> Self {
        ClaimCategory::ContractBreach
    }
}

/// Processor types for claim verdicts
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Copy, Debug)]
pub enum ProcessorType {
    /// Automated processing
    Automated,
    /// Community votes
    Community,
    /// Arbitration panel
    Arbitration,
    /// Expert review
    Expert,
    /// Admin intervention
    Admin,
}

impl Default for ProcessorType {
    fn default() -> Self {
        ProcessorType::Automated
    }
}


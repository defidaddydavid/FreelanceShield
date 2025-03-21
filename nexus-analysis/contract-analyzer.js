/**
 * Nexus Mutual Contract Analyzer
 * 
 * This script analyzes Nexus Mutual's smart contracts on Ethereum
 * to extract insights for FreelanceShield's Solana/Anchor implementation.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const ETHERSCAN_API_KEY = '33DDQFWAFC87QS7JM8SQCTJDSRSC2AT7G6'; 
const OUTPUT_DIR = path.join(__dirname, 'contract-analysis');

// Nexus Mutual contract addresses to analyze
const CONTRACTS = [
  {
    name: 'Cover',
    address: '0xcafea570e7857383e0b88f43c0dcaa3640c29781', 
    category: 'Insurance',
    description: 'Core contract for policy management'
  },
  {
    name: 'CoverBroker',
    address: '0x0000cbD7a26f72Ff222bf5f136901D224b08BE4E',
    category: 'Insurance',
    description: 'Third-party sales middleware'
  },
  {
    name: 'CoverProducts',
    address: '0xcafea02300a2fa591f0b741e4643982883dfeee3', 
    category: 'Insurance',
    description: 'Insurance product types'
  },
  {
    name: 'CoverNFT',
    address: '0xcafeaCa76be547F14D0220482667B42D8E7Bc3eb',
    category: 'Insurance',
    description: 'NFT-based insurance tokenization'
  },
  {
    name: 'IndividualClaims',
    address: '0xcafea1079707cdabdb1f31e28692545b44fb23db', 
    category: 'Claims',
    description: 'Claims processing'
  },
  {
    name: 'MCR',
    address: '0xcafea92739e411a4D95bbc2275CA61dE6993C9a7',
    category: 'Risk',
    description: 'Minimum Capital Requirements'
  },
  {
    name: 'StakingPoolFactory',
    address: '0xcafeafb97BF8831D95C0FC659b8eB3946B101CB3',
    category: 'Staking',
    description: 'Staking pool creation'
  },
  {
    name: 'StakingProducts',
    address: '0xcafea573fBd815B5f59e8049E71E554bde3477E4',
    category: 'Staking',
    description: 'Product staking definitions'
  },
  {
    name: 'Pool',
    address: '0xcafeaf6eA90CB931ae43a8Cf4B25a73a24cF6158', 
    category: 'Risk',
    description: 'Main risk pool contract'
  },
  {
    name: 'Governance',
    address: '0xcafeafa258be9acb7c0de989be21a8e9583fba65', 
    category: 'Governance',
    description: 'DAO voting'
  },
  {
    name: 'MemberRoles',
    address: '0x055CC48f7968FD8640EF140610dd4038e1b03926',
    category: 'Governance',
    description: 'Membership status management'
  },
  {
    name: 'NXMToken',
    address: '0xd7c49CEE7E9188cCa6AD8FF264C1DA2e69D4Cf3B',
    category: 'Tokenomics',
    description: 'Native token'
  },
  {
    name: 'PriceFeedOracle',
    address: '0xcafea905B417AC7778843aaE1A0b3848CA97a592',
    category: 'Tokenomics',
    description: 'Insurance pricing data'
  }
];

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Fetches contract ABI from Etherscan
 */
async function getContractABI(address) {
  try {
    const response = await axios.get(`https://api.etherscan.io/api`, {
      params: {
        module: 'contract',
        action: 'getabi',
        address: address,
        apikey: ETHERSCAN_API_KEY
      }
    });

    if (response.data.status === '1') {
      return JSON.parse(response.data.result);
    } else {
      console.error(`Error fetching ABI for ${address}: ${response.data.message}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching ABI for ${address}:`, error.message);
    return null;
  }
}

/**
 * Fetches contract source code from Etherscan
 */
async function getContractSourceCode(address) {
  try {
    const response = await axios.get(`https://api.etherscan.io/api`, {
      params: {
        module: 'contract',
        action: 'getsourcecode',
        address: address,
        apikey: ETHERSCAN_API_KEY
      }
    });

    if (response.data.status === '1' && response.data.result.length > 0) {
      return response.data.result[0];
    } else {
      console.error(`Error fetching source code for ${address}: ${response.data.message}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching source code for ${address}:`, error.message);
    return null;
  }
}

/**
 * Analyzes contract ABI to extract function signatures
 */
function analyzeContractABI(abi) {
  const functions = [];
  const events = [];
  const stateVariables = [];

  if (!abi) return { functions, events, stateVariables };

  for (const item of abi) {
    if (item.type === 'function') {
      const inputs = item.inputs.map(input => `${input.type} ${input.name}`).join(', ');
      const outputs = item.outputs.map(output => `${output.type} ${output.name}`).join(', ');
      
      functions.push({
        name: item.name,
        signature: `${item.name}(${inputs})`,
        visibility: item.stateMutability,
        returns: outputs,
        constant: item.constant || false,
        payable: item.payable || false
      });
    } else if (item.type === 'event') {
      const params = item.inputs.map(input => `${input.type} ${input.indexed ? 'indexed' : ''} ${input.name}`).join(', ');
      events.push({
        name: item.name,
        signature: `${item.name}(${params})`,
        anonymous: item.anonymous || false
      });
    }
  }

  return { functions, events, stateVariables };
}

/**
 * Extracts state variables from contract source code
 */
function extractStateVariables(sourceCode) {
  if (!sourceCode) return [];
  
  const stateVarRegex = /(\w+(?:\[\])?\s+(?:public|private|internal)\s+\w+)\s*(?:=\s*[^;]+)?;/g;
  const matches = sourceCode.match(stateVarRegex) || [];
  
  return matches.map(match => match.trim());
}

/**
 * Analyzes contract source code to identify patterns
 */
function analyzeContractPatterns(sourceCode, contractName) {
  if (!sourceCode) return {};
  
  const patterns = {
    usesOpenZeppelin: sourceCode.includes('import "@openzeppelin"'),
    usesProxy: sourceCode.includes('delegatecall') || sourceCode.includes('Proxy'),
    usesSafeERC20: sourceCode.includes('SafeERC20'),
    usesAccessControl: sourceCode.includes('AccessControl') || sourceCode.includes('Ownable'),
    usesReentrancyGuard: sourceCode.includes('ReentrancyGuard') || sourceCode.includes('nonReentrant'),
    usesPausable: sourceCode.includes('Pausable'),
    usesERC721: sourceCode.includes('ERC721'),
    usesERC20: sourceCode.includes('ERC20'),
    usesOracles: sourceCode.includes('Oracle') || sourceCode.includes('Chainlink'),
    usesMath: sourceCode.includes('SafeMath') || sourceCode.includes('Math'),
  };
  
  return patterns;
}

/**
 * Main function to analyze all contracts
 */
async function analyzeContracts() {
  console.log('Starting Nexus Mutual contract analysis...');
  
  const summary = {
    totalContracts: CONTRACTS.length,
    categoryCounts: {},
    contractDetails: []
  };
  
  // Count contracts by category
  CONTRACTS.forEach(contract => {
    summary.categoryCounts[contract.category] = (summary.categoryCounts[contract.category] || 0) + 1;
  });
  
  // Create summary file
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'analysis-summary.md'),
    `# Nexus Mutual Contract Analysis Summary\n\n` +
    `## Overview\n` +
    `Total contracts analyzed: ${CONTRACTS.length}\n\n` +
    `## Categories\n` +
    Object.entries(summary.categoryCounts).map(([category, count]) => 
      `- ${category}: ${count} contracts`
    ).join('\n') + '\n\n' +
    `## Contracts\n` +
    CONTRACTS.map(contract => 
      `- ${contract.name} (${contract.category}): ${contract.description}`
    ).join('\n') + '\n\n' +
    `## Solana/Anchor Adaptation Considerations\n\n` +
    `1. **Account Model**: Ethereum uses a balance model, while Solana uses an account model. We'll need to redesign state storage.\n\n` +
    `2. **Cross-Program Invocation**: Replace Ethereum's contract-to-contract calls with Solana's CPI (Cross-Program Invocation).\n\n` +
    `3. **Gas Optimization**: Solana has different fee structures, requiring optimization for compute units rather than gas.\n\n` +
    `4. **Storage Costs**: Solana charges rent for account storage, requiring careful account design.\n\n` +
    `5. **Tokenization**: Adapt Ethereum's ERC-721 NFT standards to Solana's SPL token standards.\n\n`
  );
  
  // Analyze each contract
  for (const contract of CONTRACTS) {
    console.log(`Analyzing ${contract.name} (${contract.address})...`);
    
    // Create contract directory
    const contractDir = path.join(OUTPUT_DIR, contract.name);
    if (!fs.existsSync(contractDir)) {
      fs.mkdirSync(contractDir, { recursive: true });
    }
    
    // Get contract ABI and source code
    const abi = await getContractABI(contract.address);
    const sourceCodeData = await getContractSourceCode(contract.address);
    const sourceCode = sourceCodeData?.SourceCode || '';
    
    // Analyze contract
    const { functions, events } = analyzeContractABI(abi);
    const stateVariables = extractStateVariables(sourceCode);
    const patterns = analyzeContractPatterns(sourceCode, contract.name);
    
    // Save contract metadata
    const metadata = {
      name: contract.name,
      address: contract.address,
      category: contract.category,
      description: contract.description,
      compiler: sourceCodeData?.CompilerVersion || 'Unknown',
      optimizationEnabled: sourceCodeData?.OptimizationUsed === '1',
      patterns
    };
    
    fs.writeFileSync(
      path.join(contractDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );
    
    // Save ABI
    if (abi) {
      fs.writeFileSync(
        path.join(contractDir, 'abi.json'),
        JSON.stringify(abi, null, 2)
      );
    }
    
    // Save source code
    if (sourceCode) {
      fs.writeFileSync(
        path.join(contractDir, 'source.sol'),
        sourceCode
      );
    }
    
    // Save analysis results
    const analysis = {
      functions,
      events,
      stateVariables,
      patterns
    };
    
    fs.writeFileSync(
      path.join(contractDir, 'analysis.json'),
      JSON.stringify(analysis, null, 2)
    );
    
    // Generate Markdown report
    const markdownReport = generateMarkdownReport(contract, functions, events, stateVariables, patterns);
    fs.writeFileSync(
      path.join(contractDir, 'report.md'),
      markdownReport
    );
    
    // Generate Solana/Anchor adaptation notes
    const adaptationNotes = generateAdaptationNotes(contract, functions, events, stateVariables, patterns);
    fs.writeFileSync(
      path.join(contractDir, 'solana-adaptation.md'),
      adaptationNotes
    );
    
    // Add to summary
    summary.contractDetails.push({
      name: contract.name,
      address: contract.address,
      category: contract.category,
      functionCount: functions.length,
      eventCount: events.length,
      stateVariableCount: stateVariables.length,
      patterns
    });
    
    console.log(`Completed analysis of ${contract.name}`);
  }
  
  // Update summary with detailed information
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'detailed-summary.json'),
    JSON.stringify(summary, null, 2)
  );
  
  console.log('Contract analysis complete. Results saved to:', OUTPUT_DIR);
}

/**
 * Generates a markdown report for a contract
 */
function generateMarkdownReport(contract, functions, events, stateVariables, patterns) {
  return `# ${contract.name} Contract Analysis

## Overview
- **Address**: ${contract.address}
- **Category**: ${contract.category}
- **Description**: ${contract.description}

## Contract Patterns
${Object.entries(patterns)
  .filter(([_, value]) => value)
  .map(([pattern, _]) => `- Uses ${pattern.replace(/uses/g, '')}`)
  .join('\n')}

## Functions (${functions.length})
${functions.map(func => 
  `### ${func.name}
- **Signature**: \`${func.signature}\`
- **Visibility**: ${func.visibility}
- **Returns**: ${func.returns || 'void'}
- **Constant**: ${func.constant}
- **Payable**: ${func.payable}
`).join('\n')}

## Events (${events.length})
${events.map(event => 
  `### ${event.name}
- **Signature**: \`${event.signature}\`
- **Anonymous**: ${event.anonymous}
`).join('\n')}

## State Variables (${stateVariables.length})
${stateVariables.map(variable => `- \`${variable}\``).join('\n')}
`;
}

/**
 * Generates Solana/Anchor adaptation notes for a contract
 */
function generateAdaptationNotes(contract, functions, events, stateVariables, patterns) {
  // Generate specific adaptation notes based on contract category and patterns
  let specificNotes = '';
  
  if (contract.category === 'Insurance') {
    specificNotes += `
## Insurance-Specific Adaptations

### Policy Account Structure
\`\`\`rust
#[account]
pub struct Policy {
    pub owner: Pubkey,
    pub coverage_amount: u64,
    pub premium_amount: u64,
    pub start_date: i64,
    pub end_date: i64,
    pub status: PolicyStatus,
    pub risk_score: u8,
    pub bump: u8,
}
\`\`\`

### Policy Creation
\`\`\`rust
pub fn create_policy(
    ctx: Context<CreatePolicy>,
    coverage_amount: u64,
    period_days: u16,
) -> Result<()> {
    let policy = &mut ctx.accounts.policy;
    let clock = Clock::get()?;
    
    // Calculate premium
    let premium_amount = calculate_premium(
        ctx.accounts.insurance_state,
        coverage_amount,
        period_days
    );
    
    // Initialize policy
    policy.owner = ctx.accounts.owner.key();
    policy.coverage_amount = coverage_amount;
    policy.premium_amount = premium_amount;
    policy.start_date = clock.unix_timestamp;
    policy.end_date = clock.unix_timestamp + (period_days as i64 * 86400);
    policy.status = PolicyStatus::Active;
    policy.bump = *ctx.bumps.get("policy").unwrap();
    
    // Transfer premium to risk pool
    // ...
    
    Ok(())
}
\`\`\`
`;
  } else if (contract.category === 'Claims') {
    specificNotes += `
## Claims-Specific Adaptations

### Claim Account Structure
\`\`\`rust
#[account]
pub struct Claim {
    pub policy: Pubkey,
    pub owner: Pubkey,
    pub amount: u64,
    pub status: ClaimStatus,
    pub submission_date: i64,
    pub risk_score: u8,
    pub bump: u8,
}
\`\`\`

### Claim Submission
\`\`\`rust
pub fn submit_claim(
    ctx: Context<SubmitClaim>,
    amount: u64,
    evidence: String,
) -> Result<()> {
    let claim = &mut ctx.accounts.claim;
    let clock = Clock::get()?;
    
    // Validate policy is active
    // ...
    
    // Calculate risk score
    let risk_score = calculate_risk_score(
        ctx.accounts.policy,
        amount,
        clock.unix_timestamp
    );
    
    // Initialize claim
    claim.policy = ctx.accounts.policy.key();
    claim.owner = ctx.accounts.owner.key();
    claim.amount = amount;
    claim.status = ClaimStatus::Pending;
    claim.submission_date = clock.unix_timestamp;
    claim.risk_score = risk_score;
    claim.bump = *ctx.bumps.get("claim").unwrap();
    
    Ok(())
}
\`\`\`
`;
  } else if (contract.category === 'Risk') {
    specificNotes += `
## Risk Pool Adaptations

### Risk Pool Account Structure
\`\`\`rust
#[account]
pub struct RiskPool {
    pub authority: Pubkey,
    pub total_capital: u64,
    pub total_coverage_liability: u64,
    pub current_reserve_ratio: u8,
    pub target_reserve_ratio: u8,
    pub min_capital_requirement: u64,
    pub bump: u8,
}
\`\`\`

### Capital Deposit
\`\`\`rust
pub fn deposit_capital(
    ctx: Context<DepositCapital>,
    amount: u64,
) -> Result<()> {
    // Transfer tokens to risk pool
    // ...
    
    // Update risk pool state
    let risk_pool = &mut ctx.accounts.risk_pool;
    risk_pool.total_capital += amount;
    
    // Recalculate reserve ratio
    if risk_pool.total_coverage_liability > 0 {
        risk_pool.current_reserve_ratio = ((risk_pool.total_capital as u128 * 100) / 
            risk_pool.total_coverage_liability as u128) as u8;
    }
    
    Ok(())
}
\`\`\`
`;
  } else if (contract.category === 'Staking') {
    specificNotes += `
## Staking Adaptations

### Staking Account Structure
\`\`\`rust
#[account]
pub struct StakingPosition {
    pub owner: Pubkey,
    pub amount: u64,
    pub start_date: i64,
    pub lock_period: u64,
    pub rewards_earned: u64,
    pub bump: u8,
}
\`\`\`

### Stake Tokens
\`\`\`rust
pub fn stake_tokens(
    ctx: Context<StakeTokens>,
    amount: u64,
    lock_period: u64,
) -> Result<()> {
    // Transfer tokens to staking pool
    // ...
    
    // Initialize staking position
    let position = &mut ctx.accounts.staking_position;
    position.owner = ctx.accounts.owner.key();
    position.amount = amount;
    position.start_date = Clock::get()?.unix_timestamp;
    position.lock_period = lock_period;
    position.rewards_earned = 0;
    position.bump = *ctx.bumps.get("staking_position").unwrap();
    
    Ok(())
}
\`\`\`
`;
  } else if (contract.category === 'Governance') {
    specificNotes += `
## Governance Adaptations

### Proposal Account Structure
\`\`\`rust
#[account]
pub struct Proposal {
    pub proposer: Pubkey,
    pub description: String,
    pub start_time: i64,
    pub end_time: i64,
    pub executed: bool,
    pub votes_for: u64,
    pub votes_against: u64,
    pub bump: u8,
}
\`\`\`

### Create Proposal
\`\`\`rust
pub fn create_proposal(
    ctx: Context<CreateProposal>,
    description: String,
    voting_period: u64,
) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;
    let clock = Clock::get()?;
    
    proposal.proposer = ctx.accounts.proposer.key();
    proposal.description = description;
    proposal.start_time = clock.unix_timestamp;
    proposal.end_time = clock.unix_timestamp + voting_period as i64;
    proposal.executed = false;
    proposal.votes_for = 0;
    proposal.votes_against = 0;
    proposal.bump = *ctx.bumps.get("proposal").unwrap();
    
    Ok(())
}
\`\`\`
`;
  } else if (contract.category === 'Tokenomics') {
    specificNotes += `
## Tokenomics Adaptations

### Using Solana Program Library (SPL) Tokens
\`\`\`rust
// Import SPL token program
use anchor_spl::token::{self, Token, TokenAccount, Mint};

// Create token mint instruction
pub fn create_token_mint(
    ctx: Context<CreateTokenMint>,
    decimals: u8,
) -> Result<()> {
    // Initialize mint with authority
    token::initialize_mint(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::InitializeMint {
                mint: ctx.accounts.mint.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
        ),
        decimals,
        ctx.accounts.authority.key,
        Some(ctx.accounts.authority.key),
    )?;
    
    Ok(())
}
\`\`\`
`;
  }
  
  return `# Solana/Anchor Adaptation for ${contract.name}

## Overview
This document outlines how to adapt the Ethereum-based ${contract.name} contract to Solana's Anchor framework.

## Key Considerations

### 1. Account Model vs. Balance Model
- Ethereum uses a balance model where state is stored in contracts
- Solana uses an account model where state is stored in separate accounts
- We'll need to create appropriate account structures for each state component

### 2. Cross-Program Invocation (CPI)
- Replace Ethereum's contract-to-contract calls with Solana's CPI
- Implement proper PDA (Program Derived Address) signing for authorized operations

### 3. Transaction Model
- Solana transactions have different constraints than Ethereum
- Design instructions to fit within Solana's transaction size limits
- Consider using multiple transactions for complex operations

### 4. Events and Logging
- Replace Ethereum events with Solana program logs
- Implement proper event logging for indexing and UI feedback

${specificNotes}

## Implementation Approach

1. Define account structures for all state components
2. Implement instructions corresponding to key contract functions
3. Design proper authorization using PDAs
4. Implement cross-program invocations for system interactions
5. Add comprehensive testing for all functionality
`;
}

// Run the analysis
analyzeContracts().catch(console.error);

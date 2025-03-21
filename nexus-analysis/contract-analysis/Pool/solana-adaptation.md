# Solana/Anchor Adaptation for Pool

## Overview
This document outlines how to adapt the Ethereum-based Pool contract to Solana's Anchor framework.

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


## Risk Pool Adaptations

### Risk Pool Account Structure
```rust
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
```

### Capital Deposit
```rust
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
```


## Implementation Approach

1. Define account structures for all state components
2. Implement instructions corresponding to key contract functions
3. Design proper authorization using PDAs
4. Implement cross-program invocations for system interactions
5. Add comprehensive testing for all functionality

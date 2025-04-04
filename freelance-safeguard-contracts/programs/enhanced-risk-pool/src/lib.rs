use anchor_lang::prelude::*;

declare_id!("236VY59pJ2XJFtG4AwTQMiTRwMRamEgCgasgPj1hsJ6f");

#[program]
pub mod enhanced_risk_pool {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}


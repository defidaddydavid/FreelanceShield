use anchor_lang::prelude::*;

declare_id!("FKKXEy4KjqPoMuEf4GxAVjJaY7quZUedEJv4WMzxoPcM");

#[program]
pub mod enhanced_risk_pool {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}


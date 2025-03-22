use anchor_lang::prelude::*;

declare_id!("EvhaNKpRfmgpFr4xqHdggh3LSedDQCmTp3w8cUsXQHTA");

#[program]
pub mod enhanced_risk_pool {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

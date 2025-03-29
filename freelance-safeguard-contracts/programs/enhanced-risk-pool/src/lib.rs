use anchor_lang::prelude::*;

declare_id!("tYdPgFrzz258F6q4Hx54e8Sr55puNCWou5Dj1oTf8VZ");

#[program]
pub mod enhanced_risk_pool {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}


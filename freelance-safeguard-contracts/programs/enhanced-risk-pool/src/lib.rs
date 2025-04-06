use anchor_lang::prelude::*;

declare_id!("HU9BSW5pyqeKa8TjzBzUhnY7QtKAY94wBVQ6yMMG386f");

#[program]
pub mod enhanced_risk_pool {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}


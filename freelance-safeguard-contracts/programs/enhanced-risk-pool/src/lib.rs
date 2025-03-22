use anchor_lang::prelude::*;

declare_id!("Aa4QyEXbZnhuLyauEnPZMHE95d8xi6SehHkkatY9ukED");

#[program]
pub mod enhanced_risk_pool {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

use anchor_lang::prelude::*;

declare_id!("AxicH3kB7CtWqALUG5pz4NwZu63yN2NbvziG3eHNsgaR");

#[program]
pub mod enhanced_risk_pool {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}


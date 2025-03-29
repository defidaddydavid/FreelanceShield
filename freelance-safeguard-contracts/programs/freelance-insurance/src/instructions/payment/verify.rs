use anchor_lang::prelude::*;
use crate::state::*;

#[derive(Accounts)]
pub struct VerifyPayment<'info> {
    #[account(mut)]
    pub freelancer: Signer<'info>,
    
    /// CHECK: Client is just a pubkey that will be stored
    pub client: UncheckedAccount<'info>,
    
    #[account(
        init,
        payer = freelancer,
        space = 8 + std::mem::size_of::<PaymentVerification>(),
        seeds = [
            PAYMENT_VERIFICATION_SEED.as_bytes(),
            freelancer.key().as_ref(),
            client.key().as_ref(),
        ],
        bump
    )]
    pub payment_verification: Account<'info, PaymentVerification>,
    
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<VerifyPayment>,
    expected_amount: u64,
    deadline: i64,
) -> Result<()> {
    let payment_verification = &mut ctx.accounts.payment_verification;
    let freelancer = &ctx.accounts.freelancer;
    let client = &ctx.accounts.client;
    let clock = Clock::get()?;
    
    payment_verification.freelancer = freelancer.key();
    payment_verification.client = client.key();
    payment_verification.expected_amount = expected_amount;
    payment_verification.deadline = deadline;
    payment_verification.status = PaymentStatus::Pending;
    payment_verification.created_at = clock.unix_timestamp;
    payment_verification.bump = *ctx.bumps.get("payment_verification").unwrap();
    
    Ok(())
}


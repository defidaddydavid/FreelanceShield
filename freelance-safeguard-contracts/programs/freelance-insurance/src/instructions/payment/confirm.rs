use anchor_lang::prelude::*;
use crate::state::*;
use crate::InsuranceError;

#[derive(Accounts)]
pub struct ConfirmPayment<'info> {
    #[account(mut)]
    pub client: Signer<'info>,
    
    #[account(
        mut,
        constraint = payment_verification.client == client.key(),
        constraint = payment_verification.status == PaymentStatus::Pending @ InsuranceError::PaymentAlreadyConfirmed
    )]
    pub payment_verification: Account<'info, PaymentVerification>,
    
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<ConfirmPayment>) -> Result<()> {
    let payment_verification = &mut ctx.accounts.payment_verification;
    
    // Update payment status
    payment_verification.status = PaymentStatus::Confirmed;
    
    Ok(())
}

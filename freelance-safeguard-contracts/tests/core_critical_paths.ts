import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo } from '@solana/spl-token';
import { assert } from 'chai';
import { FreelanceShield } from '../target/types/freelance_shield';

describe('FreelanceShield Core Critical Paths', () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.FreelanceShield as Program<FreelanceShield>;
  
  // Test accounts
  const authority = Keypair.generate();
  const user = provider.wallet;
  let programStatePDA: PublicKey;
  let programStateBump: number;
  let riskPoolPDA: PublicKey;
  let riskPoolBump: number;
  let productPDA: PublicKey;
  let productBump: number;
  let policyPDA: PublicKey;
  let policyBump: number;
  let claimPDA: PublicKey;
  let claimBump: number;
  
  // Token accounts
  let mint: PublicKey;
  let userTokenAccount: PublicKey;
  let programTokenAccount: PublicKey;
  
  // Test parameters
  const productId = new anchor.BN(1);
  const coverageAmount = new anchor.BN(10 * LAMPORTS_PER_SOL);
  const premiumAmount = new anchor.BN(1 * LAMPORTS_PER_SOL);
  const claimAmount = new anchor.BN(5 * LAMPORTS_PER_SOL);
  
  before(async () => {
    // Airdrop SOL to authority
    const airdropSignature = await provider.connection.requestAirdrop(
      authority.publicKey,
      10 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSignature);
    
    // Find program state PDA
    [programStatePDA, programStateBump] = await PublicKey.findProgramAddress(
      [Buffer.from('program_state')],
      program.programId
    );
    
    // Find risk pool PDA
    [riskPoolPDA, riskPoolBump] = await PublicKey.findProgramAddress(
      [Buffer.from('risk_pool')],
      program.programId
    );
    
    // Create token mint
    mint = await createMint(
      provider.connection,
      authority,
      authority.publicKey,
      null,
      6
    );
    
    // Create user token account
    userTokenAccount = await createAccount(
      provider.connection,
      authority,
      mint,
      user.publicKey
    );
    
    // Create program token account
    programTokenAccount = await createAccount(
      provider.connection,
      authority,
      mint,
      riskPoolPDA
    );
    
    // Mint tokens to user
    await mintTo(
      provider.connection,
      authority,
      mint,
      userTokenAccount,
      authority.publicKey,
      100 * LAMPORTS_PER_SOL
    );
    
    // Mint tokens to program
    await mintTo(
      provider.connection,
      authority,
      mint,
      programTokenAccount,
      authority.publicKey,
      1000 * LAMPORTS_PER_SOL
    );
    
    console.log('Test setup complete');
  });
  
  it('Initialize program state', async () => {
    try {
      await program.methods
        .initialize({
          riskBufferPercentage: 20,
          maxCoverageAmount: new anchor.BN(100 * LAMPORTS_PER_SOL),
          minCoverageAmount: new anchor.BN(1 * LAMPORTS_PER_SOL),
          maxCoveragePeriod: 365,
          minCoveragePeriod: 7,
          claimProcessingPeriod: 14,
          disputePeriod: 7,
          votingPeriod: 3,
          isPaused: false,
        })
        .accounts({
          authority: authority.publicKey,
          programState: programStatePDA,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();
      
      // Fetch and verify program state
      const programState = await program.account.programState.fetch(programStatePDA);
      assert.equal(programState.authority.toString(), authority.publicKey.toString());
      assert.equal(programState.riskBufferPercentage, 20);
      assert.equal(programState.isPaused, false);
      
      console.log('Program state initialized successfully');
    } catch (error) {
      console.error('Error initializing program state:', error);
      throw error;
    }
  });
  
  it('Initialize risk pool', async () => {
    try {
      await program.methods
        .initializeRiskPool(
          new anchor.BN(5 * LAMPORTS_PER_SOL), // maxAutoApproveAmount
          10, // stakingAllocationPercentage
          5,  // treasuryAllocationPercentage
          authority.publicKey // treasuryWallet
        )
        .accounts({
          authority: authority.publicKey,
          programState: programStatePDA,
          riskPool: riskPoolPDA,
          programTokenAccount: programTokenAccount,
          tokenMint: mint,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();
      
      // Fetch and verify risk pool
      const riskPool = await program.account.riskPool.fetch(riskPoolPDA);
      assert.equal(riskPool.maxAutoApproveAmount.toString(), (5 * LAMPORTS_PER_SOL).toString());
      assert.equal(riskPool.stakingAllocationPercentage, 10);
      assert.equal(riskPool.treasuryAllocationPercentage, 5);
      
      console.log('Risk pool initialized successfully');
    } catch (error) {
      console.error('Error initializing risk pool:', error);
      throw error;
    }
  });
  
  it('Create product', async () => {
    try {
      // Find product PDA
      [productPDA, productBump] = await PublicKey.findProgramAddress(
        [Buffer.from('product'), productId.toArrayLike(Buffer, 'le', 8)],
        program.programId
      );
      
      await program.methods
        .createProduct({
          productId: productId,
          name: 'Freelance Project Insurance',
          description: 'Insurance for freelance projects',
          coverageDetails: 'Covers project non-payment and client disputes',
          basePremiumRate: 10, // 10% base rate
          riskMultiplier: 100, // 1.0x multiplier (100 = 1.0)
          minCoveragePeriod: 7,
          maxCoveragePeriod: 90,
          minCoverageAmount: new anchor.BN(1 * LAMPORTS_PER_SOL),
          maxCoverageAmount: new anchor.BN(50 * LAMPORTS_PER_SOL),
          isActive: true,
        })
        .accounts({
          authority: authority.publicKey,
          programState: programStatePDA,
          product: productPDA,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();
      
      // Fetch and verify product
      const product = await program.account.product.fetch(productPDA);
      assert.equal(product.productId.toString(), productId.toString());
      assert.equal(product.name, 'Freelance Project Insurance');
      assert.equal(product.isActive, true);
      
      console.log('Product created successfully');
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  });
  
  it('Purchase policy', async () => {
    try {
      // Find policy PDA
      [policyPDA, policyBump] = await PublicKey.findProgramAddress(
        [
          Buffer.from('policy'),
          user.publicKey.toBuffer(),
          productId.toArrayLike(Buffer, 'le', 8),
        ],
        program.programId
      );
      
      const now = Math.floor(Date.now() / 1000);
      const startDate = now;
      const endDate = now + (30 * 24 * 60 * 60); // 30 days from now
      
      await program.methods
        .purchasePolicy({
          coverageAmount: coverageAmount,
          startDate: new anchor.BN(startDate),
          endDate: new anchor.BN(endDate),
          projectName: 'Test Project',
          projectDescription: 'A test project for insurance',
          clientName: 'Test Client',
          clientEmail: 'client@test.com',
        })
        .accounts({
          owner: user.publicKey,
          programState: programStatePDA,
          product: productPDA,
          policy: policyPDA,
          riskPool: riskPoolPDA,
          userTokenAccount: userTokenAccount,
          programTokenAccount: programTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      // Fetch and verify policy
      const policy = await program.account.policy.fetch(policyPDA);
      assert.equal(policy.owner.toString(), user.publicKey.toString());
      assert.equal(policy.productId.toString(), productId.toString());
      assert.equal(policy.coverageAmount.toString(), coverageAmount.toString());
      assert.equal(policy.status, 0); // Active
      
      console.log('Policy purchased successfully');
    } catch (error) {
      console.error('Error purchasing policy:', error);
      throw error;
    }
  });
  
  it('Submit claim', async () => {
    try {
      // Find claim PDA (using index 0 as this is the first claim)
      [claimPDA, claimBump] = await PublicKey.findProgramAddress(
        [
          Buffer.from('claim'),
          policyPDA.toBuffer(),
          Buffer.from([0]), // First claim has index 0
        ],
        program.programId
      );
      
      await program.methods
        .submitClaim({
          amount: claimAmount,
          description: 'Client has not paid for completed work',
          evidenceType: 'Contract and communications',
          evidenceDescription: 'Contract showing payment terms and email communications',
          evidenceAttachments: ['ipfs://QmHashExample1', 'ipfs://QmHashExample2'],
        })
        .accounts({
          owner: user.publicKey,
          programState: programStatePDA,
          policy: policyPDA,
          claim: claimPDA,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      // Fetch and verify claim
      const claim = await program.account.claim.fetch(claimPDA);
      assert.equal(claim.owner.toString(), user.publicKey.toString());
      assert.equal(claim.policyKey.toString(), policyPDA.toString());
      assert.equal(claim.amount.toString(), claimAmount.toString());
      assert.equal(claim.status, 0); // Pending
      
      // Verify the claim index was set correctly
      assert.equal(claim.index, 0);
      
      console.log('Claim submitted successfully');
      console.log('Claim risk score:', claim.riskScore);
    } catch (error) {
      console.error('Error submitting claim:', error);
      throw error;
    }
  });
  
  it('Process claim', async () => {
    try {
      await program.methods
        .processClaim(
          true, // approved
          'Claim is valid based on evidence provided'
        )
        .accounts({
          authority: authority.publicKey,
          programState: programStatePDA,
          policy: policyPDA,
          claim: claimPDA,
        })
        .signers([authority])
        .rpc();
      
      // Fetch and verify claim
      const claim = await program.account.claim.fetch(claimPDA);
      assert.equal(claim.status, 1); // Approved
      
      // Fetch and verify policy
      const policy = await program.account.policy.fetch(policyPDA);
      assert.equal(policy.status, 2); // ClaimPending
      
      console.log('Claim processed successfully');
    } catch (error) {
      console.error('Error processing claim:', error);
      throw error;
    }
  });
  
  it('Pay claim', async () => {
    try {
      await program.methods
        .payClaim(null) // No transaction signature
        .accounts({
          authority: authority.publicKey,
          programState: programStatePDA,
          policy: policyPDA,
          product: productPDA,
          claim: claimPDA,
          riskPool: riskPoolPDA,
          claimant: user.publicKey,
          claimantTokenAccount: userTokenAccount,
          programTokenAccount: programTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([authority])
        .rpc();
      
      // Fetch and verify claim
      const claim = await program.account.claim.fetch(claimPDA);
      assert.equal(claim.status, 2); // Paid
      
      // Fetch and verify policy
      const policy = await program.account.policy.fetch(policyPDA);
      assert.equal(policy.status, 3); // ClaimPaid
      
      console.log('Claim paid successfully');
    } catch (error) {
      console.error('Error paying claim:', error);
      throw error;
    }
  });
  
  it('Run risk simulation', async () => {
    try {
      // Find simulation result PDA
      const slot = await provider.connection.getSlot();
      const [simulationResultPDA] = await PublicKey.findProgramAddress(
        [
          Buffer.from('simulation'),
          new anchor.BN(slot).toArrayLike(Buffer, 'le', 8),
        ],
        program.programId
      );
      
      await program.methods
        .runRiskSimulation({
          currentPolicies: 10,
          avgClaimFrequency: 5,
          avgClaimSeverity: new anchor.BN(5 * LAMPORTS_PER_SOL),
          marketVolatility: 50,
        })
        .accounts({
          authority: authority.publicKey,
          programState: programStatePDA,
          riskPool: riskPoolPDA,
          simulationResult: simulationResultPDA,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();
      
      // Fetch and verify simulation result
      const simulationResult = await program.account.simulationResult.fetch(simulationResultPDA);
      assert.equal(simulationResult.currentPolicies, 10);
      assert.equal(simulationResult.avgClaimFrequency, 5);
      
      console.log('Risk simulation completed successfully');
      console.log('Capital adequacy ratio:', simulationResult.capitalAdequacyRatio);
      console.log('Expected loss ratio:', simulationResult.expectedLossRatio);
      console.log('Tail risk (95th):', simulationResult.tailRisk95th.toString());
      console.log('Tail risk (99th):', simulationResult.tailRisk99th.toString());
      console.log('Recommended premium adjustment:', simulationResult.recommendedPremiumAdjustment);
    } catch (error) {
      console.error('Error running risk simulation:', error);
      throw error;
    }
  });
});

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { FreelanceInsurance } from "../target/types/freelance_insurance";
import { expect } from "chai";

describe("Bayesian Model Tests", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.FreelanceInsurance as Program<FreelanceInsurance>;
  
  // Test accounts
  const admin = anchor.web3.Keypair.generate();
  const user = anchor.web3.Keypair.generate();
  
  // Program accounts
  let insuranceStatePda: anchor.web3.PublicKey;
  let riskPoolPda: anchor.web3.PublicKey;
  let policyPda: anchor.web3.PublicKey;
  
  // Test parameters
  const coverageAmount = new anchor.BN(1000000000); // 1 SOL
  const periodDays = 30;
  const jobType = 0; // Software Development
  const industry = 0; // Technology
  const reputationScore = 90;
  const claimsHistory = 0;
  const marketConditions = 50;
  
  before(async () => {
    // Airdrop SOL to admin and user
    await provider.connection.requestAirdrop(admin.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(user.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL);
    
    // Wait for confirmation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Find PDAs
    [insuranceStatePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("insurance_state")],
      program.programId
    );
    
    [riskPoolPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("risk_pool")],
      program.programId
    );
    
    // Initialize the program
    await program.methods
      .initializeProgram()
      .accounts({
        insuranceState: insuranceStatePda,
        riskPool: riskPoolPda,
        authority: admin.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([admin])
      .rpc();
    
    console.log("Program initialized");
  });
  
  it("Should initialize Bayesian parameters", async () => {
    // Update Bayesian model parameters
    await program.methods
      .updateBayesianModel()
      .accounts({
        insuranceState: insuranceStatePda,
        authority: admin.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([admin])
      .rpc();
    
    // Fetch insurance state to verify Bayesian parameters were initialized
    const insuranceState = await program.account.insuranceState.fetch(insuranceStatePda);
    
    // Verify Bayesian parameters
    expect(insuranceState.bayesianParameters.lastUpdateTimestamp.toNumber()).to.be.greaterThan(0);
    expect(insuranceState.bayesianParameters.totalPoliciesProcessed.toNumber()).to.equal(0);
    expect(insuranceState.bayesianParameters.totalClaimsProcessed.toNumber()).to.equal(0);
    
    // Verify prior probabilities were initialized
    for (let i = 0; i < insuranceState.bayesianParameters.priorProbabilities.length; i++) {
      expect(insuranceState.bayesianParameters.priorProbabilities[i].toNumber()).to.be.greaterThan(0);
    }
    
    // Verify likelihood parameters were initialized
    for (let i = 0; i < insuranceState.bayesianParameters.likelihoodParameters.length; i++) {
      expect(insuranceState.bayesianParameters.likelihoodParameters[i].toNumber()).to.be.greaterThan(0);
    }
    
    console.log("Bayesian parameters initialized successfully");
  });
  
  it("Should create a policy and collect policy data", async () => {
    // Find policy PDA
    [policyPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("policy"), user.publicKey.toBuffer()],
      program.programId
    );
    
    // Create a policy
    await program.methods
      .createPolicy(
        coverageAmount,
        periodDays,
        jobType,
        industry,
        reputationScore,
        claimsHistory
      )
      .accounts({
        policy: policyPda,
        insuranceState: insuranceStatePda,
        riskPool: riskPoolPda,
        payer: user.publicKey,
        authority: user.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user])
      .rpc();
    
    console.log("Policy created");
    
    // Collect policy data for Bayesian model
    await program.methods
      .collectPolicyData()
      .accounts({
        policy: policyPda,
        insuranceState: insuranceStatePda,
        authority: admin.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([admin])
      .rpc();
    
    // Fetch insurance state to verify policy data was collected
    const insuranceState = await program.account.insuranceState.fetch(insuranceStatePda);
    
    // Verify policy data was collected
    expect(insuranceState.bayesianParameters.totalPoliciesProcessed.toNumber()).to.equal(1);
    
    console.log("Policy data collected successfully");
  });
  
  it("Should process claim data", async () => {
    // Submit a claim
    await program.methods
      .submitClaim(
        new anchor.BN(500000000), // 0.5 SOL
        "Contract breach",
        "Client did not pay for completed work",
        ["evidence1.pdf", "evidence2.jpg"]
      )
      .accounts({
        policy: policyPda,
        insuranceState: insuranceStatePda,
        riskPool: riskPoolPda,
        authority: user.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user])
      .rpc();
    
    console.log("Claim submitted");
    
    // Process the claim (approve it)
    await program.methods
      .processClaim(
        true, // Approved
        "Claim is valid and evidence is sufficient"
      )
      .accounts({
        policy: policyPda,
        insuranceState: insuranceStatePda,
        riskPool: riskPoolPda,
        claimant: user.publicKey,
        authority: admin.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([admin])
      .rpc();
    
    console.log("Claim processed");
    
    // Process claim data for Bayesian model
    await program.methods
      .processClaimData()
      .accounts({
        policy: policyPda,
        insuranceState: insuranceStatePda,
        authority: admin.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([admin])
      .rpc();
    
    // Fetch insurance state to verify claim data was processed
    const insuranceState = await program.account.insuranceState.fetch(insuranceStatePda);
    
    // Verify claim data was processed
    expect(insuranceState.bayesianParameters.totalClaimsProcessed.toNumber()).to.equal(1);
    
    console.log("Claim data processed successfully");
  });
  
  it("Should calculate premium with Bayesian adjustment", async () => {
    // Calculate premium
    const premiumResult = await program.methods
      .calculatePremium(
        coverageAmount,
        periodDays,
        jobType,
        industry,
        reputationScore,
        claimsHistory,
        marketConditions
      )
      .accounts({
        insuranceState: insuranceStatePda,
        authority: user.publicKey,
      })
      .view();
    
    // Verify premium components include Bayesian adjustment
    expect(premiumResult.components.bayesianAdjustment.toNumber()).to.not.equal(0);
    
    console.log("Premium calculated with Bayesian adjustment:", premiumResult.premium.toString());
    console.log("Bayesian adjustment:", premiumResult.components.bayesianAdjustment.toString());
  });
});

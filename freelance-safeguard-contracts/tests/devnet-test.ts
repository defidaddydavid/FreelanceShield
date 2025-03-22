import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { expect } from "chai";
import fs from "fs";
import path from "path";

// Load the deployed program IDs from Anchor.toml
function getDevnetProgramIds() {
  const anchorToml = fs.readFileSync(path.resolve(__dirname, "../Anchor.toml"), "utf8");
  const programsSection = anchorToml.match(/\[programs\.devnet\]([\s\S]*?)(\[|\Z)/)?.[1] || "";
  
  const programIds: Record<string, PublicKey> = {};
  const matches = programsSection.matchAll(/(\w+)\s*=\s*"([^"]+)"/g);
  
  for (const match of matches) {
    const [_, programName, programId] = match;
    programIds[programName] = new PublicKey(programId);
  }
  
  return programIds;
}

describe("FreelanceShield Devnet Deployment Test", () => {
  // Configure the client to use devnet
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  
  const programIds = getDevnetProgramIds();
  console.log("Testing with deployed program IDs:", programIds);
  
  // Test wallet
  const wallet = provider.wallet as anchor.Wallet;
  
  it("Wallet has sufficient SOL balance", async () => {
    const connection = provider.connection;
    const balance = await connection.getBalance(wallet.publicKey);
    console.log(`Wallet balance: ${balance / LAMPORTS_PER_SOL} SOL`);
    expect(balance).to.be.above(0.5 * LAMPORTS_PER_SOL);
  });
  
  // Test insurance program
  if (programIds.freelance_insurance) {
    const insuranceProgram = new Program(
      JSON.parse(fs.readFileSync(path.resolve(__dirname, "../target/idl/freelance_insurance.json"), "utf8")),
      programIds.freelance_insurance,
      provider
    );
    
    it("Can connect to insurance program", async () => {
      console.log("Insurance program ID:", insuranceProgram.programId.toString());
      expect(insuranceProgram.programId.toString()).to.equal(programIds.freelance_insurance.toString());
    });
  }
  
  // Test risk pool program
  if (programIds.risk_pool_program) {
    const riskPoolProgram = new Program(
      JSON.parse(fs.readFileSync(path.resolve(__dirname, "../target/idl/risk_pool_program.json"), "utf8")),
      programIds.risk_pool_program,
      provider
    );
    
    it("Can connect to risk pool program", async () => {
      console.log("Risk pool program ID:", riskPoolProgram.programId.toString());
      expect(riskPoolProgram.programId.toString()).to.equal(programIds.risk_pool_program.toString());
    });
  }
  
  // Test claims processor program
  if (programIds.claims_processor) {
    const claimsProgram = new Program(
      JSON.parse(fs.readFileSync(path.resolve(__dirname, "../target/idl/claims_processor.json"), "utf8")),
      programIds.claims_processor,
      provider
    );
    
    it("Can connect to claims processor program", async () => {
      console.log("Claims processor program ID:", claimsProgram.programId.toString());
      expect(claimsProgram.programId.toString()).to.equal(programIds.claims_processor.toString());
    });
  }
  
  // Add more specific tests for your programs here
  // For example, you can test creating a policy, submitting a claim, etc.
  
  it("Devnet connection is working", async () => {
    const connection = new Connection("https://api.devnet.solana.com");
    const version = await connection.getVersion();
    console.log("Solana version:", version);
    expect(version).to.not.be.null;
  });
});

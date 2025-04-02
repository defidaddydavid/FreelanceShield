import React, { FC, useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

// Import contract integration utilities
import { calculatePremium, createReputationProfile, getReputationScore } from '../utils/contract-integration';
import { loadAllIdls, ProgramIdls } from '../utils/idl-loader';

/**
 * Dashboard component for FreelanceShield
 * Implements the UI for interacting with the protocol's smart contracts
 * Uses Phantom Wallet as the primary authentication method and displays real blockchain data
 */
const Dashboard: FC = () => {
  const { connection } = useConnection();
  const { publicKey, connected, signTransaction, sendTransaction, wallet } = useWallet();
  const navigate = useNavigate();
  
  // Client state
  const [client, setClient] = useState<FreelanceShieldClient | null>(null);
  const [loading, setLoading] = useState(true);
  
  // User state
  const [reputationScore, setReputationScore] = useState<number | null>(null);
  const [premiumDiscount, setPremiumDiscount] = useState<number>(0);
  const [policies, setPolicies] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  
  // Form state
  const [contractValue, setContractValue] = useState<number>(1);
  const [riskCategory, setRiskCategory] = useState<number>(2);
  const [contractDuration, setContractDuration] = useState<number>(30);
  const [contractDetails, setContractDetails] = useState<string>('');
  const [calculatedPremium, setCalculatedPremium] = useState<number | null>(null);
  
  // Claim form state
  const [selectedPolicy, setSelectedPolicy] = useState<string>('');
  const [claimAmount, setClaimAmount] = useState<number>(0);
  const [claimReason, setClaimReason] = useState<string>('');
  const [evidenceUrl, setEvidenceUrl] = useState<string>('');
  
  // Initialize client when wallet connects
  useEffect(() => {
    if (!connected || !publicKey || !wallet) {
      navigate('/');
      return;
    }
    
    const initClient = async () => {
      try {
        setLoading(true);
        const newClient = new FreelanceShieldClient(
          connection,
          wallet as any, // Type adapter for Anchor
          loadAllIdls() as ProgramIdls
        );
        
        await newClient.initialize();
        setClient(newClient);
        
        // Create reputation profile if needed
        await createReputationProfile(newClient);
        
        // Load user data
        const score = await getReputationScore(newClient);
        setReputationScore(score);
        setPremiumDiscount(Math.round((score / 100) * 25)); // Max 25% discount
        
        // TODO: Load policies and claims
        // This would fetch from the contract in production
        
        setLoading(false);
      } catch (error) {
        console.error('Error initializing client:', error);
        toast.error('Error connecting to FreelanceShield');
        setLoading(false);
      }
    };
    
    initClient();
  }, [connected, publicKey, wallet, connection, navigate]);
  
  // Handle premium calculation
  const handleCalculatePremium = async () => {
    if (!client) return;
    
    try {
      setLoading(true);
      const premium = await calculatePremium(
        client,
        contractValue * LAMPORTS_PER_SOL,
        riskCategory,
        contractDuration
      );
      
      setCalculatedPremium(premium / LAMPORTS_PER_SOL);
      setLoading(false);
    } catch (error) {
      console.error('Error calculating premium:', error);
      toast.error('Error calculating premium');
      setLoading(false);
    }
  };
  
  // Handle policy purchase
  const handlePurchasePolicy = async () => {
    if (!client || !calculatedPremium) return;
    
    try {
      setLoading(true);
      const contractId = `contract-${Date.now()}`;
      const policyId = await client.purchasePolicy(
        contractValue * LAMPORTS_PER_SOL,
        riskCategory,
        contractDuration,
        contractDetails,
        contractId
      );
      
      toast.success(`Policy purchased! ID: ${policyId}`);
      
      // Add to local state
      setPolicies([
        ...policies, 
        { 
          id: policyId, 
          contractValue: contractValue * LAMPORTS_PER_SOL, 
          premium: calculatedPremium * LAMPORTS_PER_SOL,
          date: new Date(),
          details: contractDetails
        }
      ]);
      
      // Reset form
      setCalculatedPremium(null);
      setContractDetails('');
      
      setLoading(false);
    } catch (error) {
      console.error('Error purchasing policy:', error);
      toast.error('Error purchasing policy');
      setLoading(false);
    }
  };
  
  // Handle claim submission
  const handleSubmitClaim = async () => {
    if (!client || !selectedPolicy) return;
    
    try {
      setLoading(true);
      const claimId = await client.submitClaim(
        selectedPolicy,
        claimAmount * LAMPORTS_PER_SOL,
        claimReason,
        evidenceUrl ? [evidenceUrl] : []
      );
      
      toast.success(`Claim submitted! ID: ${claimId}`);
      
      // Add to local state
      setClaims([
        ...claims, 
        { 
          id: claimId,
          policyId: selectedPolicy,
          amount: claimAmount * LAMPORTS_PER_SOL,
          reason: claimReason,
          evidenceUrls: evidenceUrl ? [evidenceUrl] : [],
          status: 'Pending',
          date: new Date()
        }
      ]);
      
      // Reset form
      setSelectedPolicy('');
      setClaimAmount(0);
      setClaimReason('');
      setEvidenceUrl('');
      
      setLoading(false);
    } catch (error) {
      console.error('Error submitting claim:', error);
      toast.error('Error submitting claim');
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading FreelanceShield...</div>;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>FreelanceShield Dashboard</h1>
        <div className="user-info">
          <div className="wallet-address">
            {publicKey?.toString().slice(0, 6)}...{publicKey?.toString().slice(-4)}
          </div>
          <div className="reputation-score">
            <span>Reputation: {reputationScore}/100</span>
            <span className="premium-discount">({premiumDiscount}% discount)</span>
          </div>
        </div>
      </header>
      
      <div className="dashboard-content">
        <div className="dashboard-section">
          <h2>Purchase Insurance Policy</h2>
          <div className="form-group">
            <label>Contract Value (SOL):</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={contractValue}
              onChange={(e) => setContractValue(parseFloat(e.target.value))}
            />
          </div>
          
          <div className="form-group">
            <label>Contract Duration (days):</label>
            <input
              type="number"
              min="1"
              value={contractDuration}
              onChange={(e) => setContractDuration(parseInt(e.target.value))}
            />
          </div>
          
          <div className="form-group">
            <label>Risk Category:</label>
            <select 
              value={riskCategory} 
              onChange={(e) => setRiskCategory(parseInt(e.target.value))}
            >
              <option value="1">Low Risk</option>
              <option value="2">Medium Risk</option>
              <option value="3">High Risk</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Contract Details:</label>
            <textarea
              value={contractDetails}
              onChange={(e) => setContractDetails(e.target.value)}
              placeholder="Describe the freelance project..."
              rows={3}
            />
          </div>
          
          <div className="actions">
            <button 
              onClick={handleCalculatePremium}
              className="button secondary"
            >
              Calculate Premium
            </button>
            
            {calculatedPremium !== null && (
              <div className="premium-result">
                <p>Premium: {calculatedPremium} SOL</p>
                <p>With Reputation Discount: {(calculatedPremium * (100 - premiumDiscount) / 100).toFixed(4)} SOL</p>
                <button 
                  onClick={handlePurchasePolicy}
                  className="button primary"
                >
                  Purchase Policy
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="dashboard-section">
          <h2>My Policies</h2>
          {policies.length === 0 ? (
            <p className="empty-state">No policies found. Purchase a policy to protect your freelance work.</p>
          ) : (
            <div className="policies-list">
              {policies.map((policy) => (
                <div className="policy-card" key={policy.id}>
                  <div className="policy-header">
                    <span className="policy-id">Policy #{policy.id.substring(0, 8)}</span>
                    <span className="policy-date">{policy.date.toLocaleDateString()}</span>
                  </div>
                  <div className="policy-details">
                    <div className="policy-value">
                      <strong>Contract Value:</strong> {policy.contractValue / LAMPORTS_PER_SOL} SOL
                    </div>
                    <div className="policy-premium">
                      <strong>Premium Paid:</strong> {policy.premium / LAMPORTS_PER_SOL} SOL
                    </div>
                    <div className="policy-description">
                      <strong>Details:</strong> {policy.details}
                    </div>
                  </div>
                  <div className="policy-actions">
                    <button onClick={() => setSelectedPolicy(policy.id)}>File Claim</button>
                    <button>View NFT</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="dashboard-section">
          <h2>File a Claim</h2>
          <div className="form-group">
            <label>Select Policy:</label>
            <select 
              value={selectedPolicy} 
              onChange={(e) => setSelectedPolicy(e.target.value)}
            >
              <option value="">-- Select Policy --</option>
              {policies.map((policy) => (
                <option key={policy.id} value={policy.id}>
                  Policy #{policy.id.substring(0, 8)} - {policy.contractValue / LAMPORTS_PER_SOL} SOL
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Claim Amount (SOL):</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={claimAmount}
              onChange={(e) => setClaimAmount(parseFloat(e.target.value))}
            />
          </div>
          
          <div className="form-group">
            <label>Claim Reason:</label>
            <textarea
              value={claimReason}
              onChange={(e) => setClaimReason(e.target.value)}
              placeholder="Describe the reason for your claim..."
              rows={3}
            />
          </div>
          
          <div className="form-group">
            <label>Evidence URL:</label>
            <input
              type="text"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              placeholder="Link to evidence (optional)"
            />
          </div>
          
          <div className="actions">
            <button 
              onClick={handleSubmitClaim}
              disabled={!selectedPolicy || claimAmount <= 0 || !claimReason}
              className="button primary"
            >
              Submit Claim
            </button>
          </div>
        </div>
        
        <div className="dashboard-section">
          <h2>My Claims</h2>
          {claims.length === 0 ? (
            <p className="empty-state">No claims filed yet.</p>
          ) : (
            <div className="claims-list">
              {claims.map((claim) => (
                <div className="claim-card" key={claim.id}>
                  <div className="claim-header">
                    <span className="claim-id">Claim #{claim.id.substring(0, 8)}</span>
                    <span className={`claim-status ${claim.status.toLowerCase()}`}>{claim.status}</span>
                  </div>
                  <div className="claim-details">
                    <div className="claim-policy">
                      <strong>Policy:</strong> #{claim.policyId.substring(0, 8)}
                    </div>
                    <div className="claim-amount">
                      <strong>Amount:</strong> {claim.amount / LAMPORTS_PER_SOL} SOL
                    </div>
                    <div className="claim-reason">
                      <strong>Reason:</strong> {claim.reason}
                    </div>
                    <div className="claim-date">
                      <strong>Filed:</strong> {claim.date.toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

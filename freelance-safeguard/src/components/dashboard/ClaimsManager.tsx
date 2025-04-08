import { useState, useMemo } from 'react';
import { useClaimsAndPool } from '@/hooks/useClaimsAndPool';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatSOL } from '@/lib/utils';

interface ClaimFormData {
  policyId: string;
  amount: number;
  type: 'PAYMENT_BREACH' | 'CONTRACT_VIOLATION' | 'EQUIPMENT_DAMAGE';
  description: string;
  attachments: string[];
}

export function ClaimsManager() {
  const { publicKey } = useWallet();
  const { submitClaim, submitArbitrationVote, useClaimStatus } = useClaimsAndPool();
  const [selectedClaim, setSelectedClaim] = useState<PublicKey | null>(null);
  const [formData, setFormData] = useState<ClaimFormData>({
    policyId: '',
    amount: 0,
    type: 'PAYMENT_BREACH',
    description: '',
    attachments: [],
  });

  // Get status of selected claim with proper error handling
  const claimStatus = useMemo(() => {
    try {
      // Only call the hook if we have a valid claim
      if (!selectedClaim) return { data: null, isLoading: false, error: null };
      return useClaimStatus(selectedClaim);
    } catch (error) {
      console.error('Error in claim status hook:', error);
      return { data: null, isLoading: false, error };
    }
  }, [selectedClaim, useClaimStatus]);

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.policyId) return;

    try {
      const policyId = new PublicKey(formData.policyId);
      await submitClaim.mutate({
        policyId,
        amount: formData.amount,
        evidence: {
          type: formData.type,
          description: formData.description,
          attachments: formData.attachments,
        },
      });
    } catch (error) {
      console.error('Error submitting claim:', error);
    }
  };

  const handleVote = async (claimId: PublicKey, vote: boolean, comments: string) => {
    if (!comments.trim()) {
      alert('Please provide comments for your vote');
      return;
    }
    
    try {
      await submitArbitrationVote.mutate({
        claimId,
        vote,
        comments,
      });
    } catch (error) {
      console.error('Error submitting vote:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-500';
      case 'APPROVED':
        return 'bg-green-500';
      case 'REJECTED':
        return 'bg-red-500';
      case 'ARBITRATION':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="submit">
        <TabsList>
          <TabsTrigger value="submit">Submit Claim</TabsTrigger>
          <TabsTrigger value="status">Claim Status</TabsTrigger>
          {publicKey && <TabsTrigger value="arbitration">Arbitration</TabsTrigger>}
        </TabsList>

        <TabsContent value="submit">
          <Card>
            <CardHeader>
              <CardTitle>Submit Insurance Claim</CardTitle>
              <CardDescription>
                File a new claim for policy coverage. Ensure you provide accurate information
                and supporting evidence.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitClaim} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Policy ID</label>
                  <Input
                    value={formData.policyId}
                    onChange={(e) => setFormData({ ...formData, policyId: e.target.value })}
                    placeholder="Enter your policy ID"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Claim Amount (SOL)</label>
                  <Input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    min={0}
                    step={0.1}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Claim Type</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={formData.type}
                    onChange={(e) => setFormData({
                      ...formData,
                      type: e.target.value as ClaimFormData['type']
                    })}
                  >
                    <option value="PAYMENT_BREACH">Payment Breach</option>
                    <option value="CONTRACT_VIOLATION">Contract Violation</option>
                    <option value="EQUIPMENT_DAMAGE">Equipment Damage</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your claim in detail"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Evidence (IPFS hashes)</label>
                  <Input
                    value={formData.attachments.join(', ')}
                    onChange={(e) => setFormData({
                      ...formData,
                      attachments: e.target.value.split(',').map(s => s.trim())
                    })}
                    placeholder="Enter IPFS hashes of supporting documents"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitClaim.isLoading}
                  className="w-full"
                >
                  {submitClaim.isLoading ? 'Submitting...' : 'Submit Claim'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle>Claim Status</CardTitle>
              <CardDescription>
                View the status and details of your submitted claims
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedClaim && claimStatus?.data ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">
                      Claim #{selectedClaim.toString().slice(0, 8)}...
                    </h3>
                    <Badge className={getStatusColor(claimStatus.data.status || 'UNKNOWN')}>
                      {claimStatus.data.status || 'UNKNOWN'}
                    </Badge>
                  </div>

                  <div className="grid gap-2">
                    <div>
                      <span className="font-medium">Amount:</span>{' '}
                      {formatSOL(claimStatus.data.payoutAmount || 0)}
                    </div>
                    <div>
                      <span className="font-medium">Reason:</span>{' '}
                      {claimStatus.data.reason || 'No reason provided'}
                    </div>
                    {claimStatus.data.arbitrationRequired && (
                      <Alert>
                        <AlertDescription>
                          This claim requires arbitration. Current votes: {Array.isArray(claimStatus.data.votes) ? claimStatus.data.votes.length : 0}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              ) : claimStatus?.isLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Loading claim details...</p>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  Enter a claim ID to view its status
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Input
                placeholder="Enter claim ID to check status"
                onChange={(e) => {
                  try {
                    const value = e.target.value.trim();
                    if (value) {
                      setSelectedClaim(new PublicKey(value));
                    } else {
                      setSelectedClaim(null);
                    }
                  } catch {
                    setSelectedClaim(null);
                  }
                }}
              />
            </CardFooter>
          </Card>
        </TabsContent>

        {publicKey && (
          <TabsContent value="arbitration">
            <Card>
              <CardHeader>
                <CardTitle>Arbitration Panel</CardTitle>
                <CardDescription>
                  Review and vote on claims that require arbitration
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedClaim && claimStatus?.data?.arbitrationRequired ? (
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <h3 className="font-medium">Cast Your Vote</h3>
                      <Textarea
                        placeholder="Add your comments (required)"
                        id="arbitration-comments"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            const commentsEl = document.getElementById('arbitration-comments') as HTMLTextAreaElement;
                            handleVote(selectedClaim, true, commentsEl?.value || '');
                          }}
                          className="flex-1 bg-green-500 hover:bg-green-600"
                        >
                          Approve Claim
                        </Button>
                        <Button
                          onClick={() => {
                            const commentsEl = document.getElementById('arbitration-comments') as HTMLTextAreaElement;
                            handleVote(selectedClaim, false, commentsEl?.value || '');
                          }}
                          className="flex-1 bg-red-500 hover:bg-red-600"
                        >
                          Reject Claim
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    No claim selected or the selected claim does not require arbitration
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

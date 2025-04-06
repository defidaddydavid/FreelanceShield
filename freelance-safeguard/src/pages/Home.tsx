import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Wallet, FileText, ArrowRight } from 'lucide-react';

export function Home() {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight">FreelanceShield</h1>
          <p className="text-xl text-muted-foreground mt-2">
            Decentralized insurance for freelancers on Solana
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-between">
                <CardTitle>Wallet Connection</CardTitle>
                <Wallet className="h-5 w-5 text-pink-600 dark:text-pink-400" />
              </div>
              <CardDescription>Connect your Solana wallet to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                FreeLanceShield supports Phantom, Solflare, and other Solana wallets. 
                Connect your wallet to create policies and submit claims.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-between">
                <CardTitle>Insurance Policies</CardTitle>
                <ShieldCheck className="h-5 w-5 text-pink-600 dark:text-pink-400" />
              </div>
              <CardDescription>Create customized insurance coverage</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Protect yourself against non-payment, contract disputes, and other freelancing risks.
                Policies are backed by our decentralized risk pool.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-between">
                <CardTitle>Claims Processing</CardTitle>
                <FileText className="h-5 w-5 text-pink-600 dark:text-pink-400" />
              </div>
              <CardDescription>Fast and transparent claims resolution</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Submit claims with evidence and receive quick payouts for valid claims.
                Our decentralized arbitration system ensures fair outcomes.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>Protect your freelance work with blockchain-based insurance</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Experience the full functionality of FreelanceShield on the Solana blockchain.
              Create policies, submit claims, and explore our risk assessment model.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate('/how-it-works')} className="w-full bg-pink-600 hover:bg-pink-500 text-white">
              Learn How It Works <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
}

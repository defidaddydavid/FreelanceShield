import React from "react";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";
import { Wallet, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface WalletConnectionSectionProps {
  className?: string;
}

export function WalletConnectionSection({ className }: WalletConnectionSectionProps) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <div 
      ref={ref}
      className={cn("w-full py-12", className)}
    >
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Content */}
          <div className="space-y-6">
            <div 
              className={cn(
                "space-y-3 opacity-0 translate-y-4 transition-all duration-500",
                inView && "opacity-100 translate-y-0"
              )}
              style={{ transitionDelay: "100ms" }}
            >
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Connect Your Wallet & <span className="text-blue-600 dark:text-blue-400">Set Up Your Profile</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Getting started with FreelanceShield is simple and secure. Connect your Solana wallet and create your freelancer profile in minutes.
              </p>
            </div>

            <div 
              className={cn(
                "space-y-4 opacity-0 translate-y-4 transition-all duration-500",
                inView && "opacity-100 translate-y-0"
              )}
              style={{ transitionDelay: "200ms" }}
            >
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 mt-1">
                  <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Connect Your Wallet</h3>
                  <p className="text-muted-foreground mt-1">
                    We support Phantom, Solflare, and Backpack wallets for secure blockchain transactions.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 mt-1">
                  <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Complete Your Profile</h3>
                  <p className="text-muted-foreground mt-1">
                    Add your work history, portfolio, and freelance details to help us calculate your risk profile.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 mt-1">
                  <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">View Your Risk Profile</h3>
                  <p className="text-muted-foreground mt-1">
                    See your personalized risk assessment and reputation score that affects your premium rates.
                  </p>
                </div>
              </div>
            </div>

            <div 
              className={cn(
                "pt-4 opacity-0 translate-y-4 transition-all duration-500",
                inView && "opacity-100 translate-y-0"
              )}
              style={{ transitionDelay: "300ms" }}
            >
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Connect Wallet
              </Button>
            </div>
          </div>

          {/* Right side - Wallet UI Mockup */}
          <div 
            className={cn(
              "opacity-0 translate-y-4 transition-all duration-500",
              inView && "opacity-100 translate-y-0"
            )}
            style={{ transitionDelay: "400ms" }}
          >
            <Card className="border border-blue-200 dark:border-blue-900/30 p-6 rounded-xl shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50">
                      <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-xl font-semibold">Wallet Connection</h3>
                  </div>
                  <div className="text-sm px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                    Connected
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Wallet Address</div>
                    <div className="font-mono text-sm bg-muted p-2 rounded">
                      7XSs...dK92
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Balance</div>
                    <div className="font-medium">2.45 SOL</div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Risk Profile</div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Low Risk</span>
                      <span className="font-medium">75/100</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Reputation Score</div>
                    <div className="flex items-center gap-1">
                      <div className="text-lg font-medium">4.8</div>
                      <div className="text-yellow-500 flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg key={star} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button variant="outline" size="sm" className="w-full">
                    View Profile Details
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WalletConnectionSection;

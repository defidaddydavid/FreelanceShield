import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, ArrowRight, Coins, FileCheck, Users, Activity } from "lucide-react";
import WalletRequired from "./WalletRequired";

/**
 * Dashboard wallet section component that displays wallet-related cards and actions
 * Uses the new color scheme and font styles while maintaining all existing functionality
 */
const DashboardWalletSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <WalletRequired>
      <section className="space-y-6">
        <Tabs defaultValue="insurance" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-800 border border-shield-purple/20 rounded-lg p-1">
            <TabsTrigger 
              value="insurance" 
              className="data-[state=active]:bg-shield-purple data-[state=active]:text-white dark:data-[state=active]:bg-shield-blue"
            >
              <Shield className="mr-2 h-4 w-4" />
              Insurance
            </TabsTrigger>
            <TabsTrigger 
              value="balance" 
              className="data-[state=active]:bg-shield-purple data-[state=active]:text-white dark:data-[state=active]:bg-shield-blue"
            >
              <Coins className="mr-2 h-4 w-4" />
              Balance
            </TabsTrigger>
            <TabsTrigger 
              value="activity" 
              className="data-[state=active]:bg-shield-purple data-[state=active]:text-white dark:data-[state=active]:bg-shield-blue"
            >
              <Activity className="mr-2 h-4 w-4" />
              Activity
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="insurance" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-shield-purple/20 bg-white dark:bg-gray-900">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-heading text-shield-purple dark:text-shield-blue flex items-center">
                    <Shield className="mr-2 h-5 w-5" />
                    Active Protection
                  </CardTitle>
                  <CardDescription>Your current protection status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-numeric font-bold">2</div>
                      <div className="text-sm text-muted-foreground">Active policies</div>
                    </div>
                    <div className="bg-shield-purple/10 p-3 rounded-full">
                      <Shield className="h-6 w-6 text-shield-purple" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => navigate("/policies")}
                  >
                    View Policies
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
              
              <Card className="border-shield-purple/20 bg-white dark:bg-gray-900">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-heading flex items-center">
                    <Coins className="mr-2 h-5 w-5 text-shield-blue" />
                    Staking
                  </CardTitle>
                  <CardDescription>Your staking overview</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-numeric font-bold">5.25 SOL</div>
                      <div className="text-sm text-muted-foreground">Total staked</div>
                    </div>
                    <div className="bg-shield-blue/10 p-3 rounded-full">
                      <Coins className="h-6 w-6 text-shield-blue" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => navigate("/staking")}
                  >
                    Manage Staking
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            <Card className="border-shield-purple/20 bg-white dark:bg-gray-900">
              <CardHeader>
                <CardTitle className="font-heading">Recent Activity</CardTitle>
                <CardDescription>Your recent transactions and policy changes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="bg-shield-blue/10 p-2 rounded-full">
                      <Coins className="h-5 w-5 text-shield-blue" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h4 className="font-medium">Staked 2 SOL</h4>
                        <span className="text-sm text-muted-foreground">2 days ago</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Transaction: 4xzT...8mVs</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="bg-shield-purple/10 p-2 rounded-full">
                      <Shield className="h-5 w-5 text-shield-purple" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h4 className="font-medium">New Policy Created</h4>
                        <span className="text-sm text-muted-foreground">3 days ago</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Policy ID: FSP-2023-0012</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" className="w-full" onClick={() => navigate("/activity")}>
                  View All Activity
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="balance" className="space-y-4 mt-4">
            <Card className="border-shield-purple/20 bg-white dark:bg-gray-900">
              <CardHeader>
                <CardTitle className="font-heading">Transaction History</CardTitle>
                <CardDescription>Your recent transactions on the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center space-x-3">
                      <Coins className="h-5 w-5 text-shield-blue" />
                      <div>
                        <div className="font-medium">Staked 2 SOL</div>
                        <div className="text-sm text-muted-foreground">Apr 4, 2025</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-numeric font-medium">2.00 SOL</div>
                      <div className="text-xs text-muted-foreground">4xzT...8mVs</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center space-x-3">
                      <Shield className="h-5 w-5 text-shield-purple" />
                      <div>
                        <div className="font-medium">Policy Payment</div>
                        <div className="text-sm text-muted-foreground">Apr 3, 2025</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-numeric font-medium">0.25 SOL</div>
                      <div className="text-xs text-muted-foreground">7kLm...9pQr</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Coins className="h-5 w-5 text-shield-blue" />
                      <div>
                        <div className="font-medium">Staked 3 SOL</div>
                        <div className="text-sm text-muted-foreground">Apr 1, 2025</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-numeric font-medium">3.00 SOL</div>
                      <div className="text-xs text-muted-foreground">2bNx...5tYz</div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Export Transactions
                  <FileCheck className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="activity" className="space-y-4 mt-4">
            <Card className="border-shield-purple/20 bg-white dark:bg-gray-900">
              <CardHeader>
                <CardTitle className="font-heading">Your Policies</CardTitle>
                <CardDescription>Active and past protection policies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center space-x-3">
                      <Shield className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="font-medium">Web Development Project</div>
                        <div className="text-sm text-muted-foreground">Active • Expires May 15, 2025</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-numeric font-medium">1,500 USDC</div>
                      <div className="text-xs text-green-500">Protected</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center space-x-3">
                      <Shield className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="font-medium">Logo Design</div>
                        <div className="text-sm text-muted-foreground">Active • Expires Apr 30, 2025</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-numeric font-medium">500 USDC</div>
                      <div className="text-xs text-green-500">Protected</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Shield className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Content Writing</div>
                        <div className="text-sm text-muted-foreground">Expired • Mar 15, 2025</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-numeric font-medium">300 USDC</div>
                      <div className="text-xs text-muted-foreground">Completed</div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-shield-purple hover:bg-shield-purple/90 text-white">
                  Create New Policy
                  <Shield className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="border-shield-purple/20 bg-white dark:bg-gray-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-heading flex items-center">
                  <Users className="mr-2 h-5 w-5 text-shield-blue" />
                  Clients & Partners
                </CardTitle>
                <CardDescription>People you've worked with</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-numeric font-bold">5</div>
                    <div className="text-sm text-muted-foreground">Total connections</div>
                  </div>
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </WalletRequired>
  );
};

export default DashboardWalletSection;

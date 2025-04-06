import { useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const Settings = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-brick font-bold mb-2">Settings</h1>
        <p className="text-shield-gray-dark">
          Manage your account settings and preferences.
        </p>
      </div>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="wallet">Wallet</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="font-brick">Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and profile details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" defaultValue="Alex Smith" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display-name">Display Name</Label>
                  <Input id="display-name" defaultValue="alexsmith" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" defaultValue="alex@example.com" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <textarea 
                  id="bio" 
                  className="w-full min-h-[100px] p-2 border rounded-md resize-y"
                  defaultValue="Freelance blockchain developer with 5 years of experience in DeFi projects."
                />
              </div>
              
              <div className="pt-4 flex justify-end">
                <Button>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="font-brick">Notification Preferences</CardTitle>
              <CardDescription>
                Control which notifications you receive and how.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-brick">Policy Updates</h3>
                    <p className="text-sm text-shield-gray-dark">Receive notifications about your policy status</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-brick">Claim Status</h3>
                    <p className="text-sm text-shield-gray-dark">Get notified about changes to your claim status</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-brick">Premium Reminders</h3>
                    <p className="text-sm text-shield-gray-dark">Alerts before premium payments are due</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-brick">Platform News</h3>
                    <p className="text-sm text-shield-gray-dark">Updates about new features and platform changes</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-brick">Marketing Emails</h3>
                    <p className="text-sm text-shield-gray-dark">Promotional content and special offers</p>
                  </div>
                  <Switch />
                </div>
                
                <div className="pt-4 flex justify-end">
                  <Button>Save Preferences</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="wallet">
          <Card>
            <CardHeader>
              <CardTitle className="font-brick">Wallet Settings</CardTitle>
              <CardDescription>
                Manage your connected wallets and payment settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-brick mb-2">Connected Wallets</h3>
                  <div className="p-4 border rounded-lg mb-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="bg-shield-blue/10 p-2 rounded-full mr-3">
                          <div className="text-shield-blue">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 17V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2Z" />
                              <polyline points="8,16 10,10 12,16 14,10 16,16" />
                            </svg>
                          </div>
                        </div>
                        <div>
                          <p className="font-brick">Phantom Wallet</p>
                          <p className="text-sm text-shield-gray-dark">5v2y...8mx4</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Disconnect</Button>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">Connect Another Wallet</Button>
                </div>
                
                <div>
                  <h3 className="font-brick mb-2">Default Payment Method</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input type="radio" id="sol" name="payment" defaultChecked className="h-4 w-4" />
                      <Label htmlFor="sol">Pay with SOL</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="radio" id="usdc" name="payment" className="h-4 w-4" />
                      <Label htmlFor="usdc">Pay with USDC</Label>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 flex justify-end">
                  <Button>Save Wallet Settings</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="font-brick">Security Settings</CardTitle>
              <CardDescription>
                Manage your account security and access settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-brick mb-2">Two-Factor Authentication</h3>
                  <p className="text-sm text-shield-gray-dark mb-3">Add an extra layer of security to your account</p>
                  <Button>Enable 2FA</Button>
                </div>
                
                <div>
                  <h3 className="font-brick mb-2">Session Settings</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-shield-gray-dark">Auto-lock after inactivity</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
                
                <div>
                  <h3 className="font-brick mb-2">Active Sessions</h3>
                  <div className="p-4 border rounded-lg mb-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-brick">Current Session</p>
                        <p className="text-sm text-shield-gray-dark">Chrome on macOS • 192.168.1.5</p>
                        <p className="text-xs text-shield-gray-dark">Started 2 hours ago</p>
                      </div>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Active</span>
                    </div>
                  </div>
                  <Button variant="outline">Sign Out All Other Sessions</Button>
                </div>
                
                <div className="pt-4 flex justify-end">
                  <Button>Save Security Settings</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Settings;

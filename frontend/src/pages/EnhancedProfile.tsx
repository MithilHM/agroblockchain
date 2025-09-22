import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  User, 
  Mail, 
  Wallet, 
  CreditCard, 
  ArrowLeft, 
  Banknote, 
  PlusCircle,
  MinusCircle,
  History,
  MapPin,
  Bell,
  Settings,
  TrendingUp,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';

interface WalletData {
  wallet: {
    address: string;
    user_id: string;
    user_name: string;
    user_role: string;
  };
  statistics: {
    current_batches_count: number;
    current_inventory_value: number;
    total_outgoing_value: number;
    total_incoming_value: number;
    net_balance: number;
    total_transactions: number;
  };
  recent_batches: any[];
  recent_transactions: {
    outgoing: any[];
    incoming: any[];
  };
}

interface Transaction {
  id: string;
  price_transferred: string;
  transfer_date: string;
  direction: 'incoming' | 'outgoing';
  counterpart: {
    name: string;
    role: string;
  };
  batch: {
    batch_id: string;
    product_name: string;
  };
}

interface EarningsData {
  period_days: number;
  total_earnings: number;
  total_transactions: number;
  average_per_transaction: number;
  sales_by_product: any[];
  daily_earnings: any[];
}

interface NotificationPreferences {
  batch_transfers: boolean;
  quality_updates: boolean;
  expiry_warnings: boolean;
  price_alerts: boolean;
  system_updates: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
}

export default function EnhancedProfile() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    batch_transfers: true,
    quality_updates: true,
    expiry_warnings: true,
    price_alerts: true,
    system_updates: true,
    email_notifications: false,
    sms_notifications: false
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'incoming' | 'outgoing'>('all');

  useEffect(() => {
    loadWalletData();
    loadTransactionHistory();
    loadEarningsData();
    loadNotificationPreferences();
  }, []);

  const loadWalletData = async () => {
    try {
      const response = await apiClient.get('/api/wallet/details');
      if (response.success) {
        setWalletData(response.data);
        setWalletAddress(response.data.wallet.address || '');
      }
    } catch (error) {
      console.error('Failed to load wallet data:', error);
    }
  };

  const loadTransactionHistory = async () => {
    try {
      const response = await apiClient.get(`/api/wallet/transactions?type=${transactionFilter}&limit=10`);
      if (response.success) {
        setTransactions(response.data.transactions);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  const loadEarningsData = async () => {
    try {
      if (['farmer', 'distributor'].includes(user?.role || '')) {
        const response = await apiClient.get('/api/wallet/earnings?period=30');
        if (response.success) {
          setEarnings(response.data);
        }
      }
    } catch (error) {
      console.error('Failed to load earnings data:', error);
    }
  };

  const loadNotificationPreferences = async () => {
    try {
      const response = await apiClient.get('/api/notifications/preferences');
      if (response.success) {
        setPreferences(response.data.preferences);
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }
  };

  const handleUpdateWalletAddress = async () => {
    if (!walletAddress) {
      toast({
        title: "Error",
        description: "Please enter a wallet address",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiClient.put('/api/wallet/address', {
        wallet_address: walletAddress
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Wallet address updated successfully"
        });
        loadWalletData();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update wallet address",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePreferences = async (key: keyof NotificationPreferences, value: boolean) => {
    const updatedPreferences = { ...preferences, [key]: value };
    setPreferences(updatedPreferences);

    try {
      await apiClient.put('/api/notifications/preferences', {
        preferences: { [key]: value }
      });
      
      toast({
        title: "Updated",
        description: "Notification preferences saved"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update preferences",
        variant: "destructive"
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'farmer': return 'bg-green-500';
      case 'distributor': return 'bg-blue-500';
      case 'retailer': return 'bg-purple-500';
      case 'admin': return 'bg-red-500';
      case 'regulator': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  useEffect(() => {
    loadTransactionHistory();
  }, [transactionFilter]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => window.history.back()}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-2">
                <User className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">Enhanced Profile</h1>
              </div>
            </div>
            
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="wallet">Wallet</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Personal Info</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Name</Label>
                    <p className="font-medium">{user?.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Email</Label>
                    <p className="font-medium">{user?.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Role</Label>
                    <Badge className={`${getRoleColor(user?.role || '')} text-white`}>
                      {user?.role?.toUpperCase()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Wallet Summary */}
              {walletData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Wallet className="h-5 w-5" />
                      <span>Wallet Summary</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Net Balance</Label>
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(walletData.statistics.net_balance)}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-muted-foreground">Inventory</Label>
                        <p className="font-medium">{formatCurrency(walletData.statistics.current_inventory_value)}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Transactions</Label>
                        <p className="font-medium">{walletData.statistics.total_transactions}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Stats */}
              {earnings && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5" />
                      <span>30-Day Performance</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Total Earnings</Label>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(earnings.total_earnings)}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-muted-foreground">Sales</Label>
                        <p className="font-medium">{earnings.total_transactions}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Avg/Sale</Label>
                        <p className="font-medium">{formatCurrency(earnings.average_per_transaction)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Wallet Tab */}
          <TabsContent value="wallet" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Wallet Address</CardTitle>
                  <CardDescription>Update your blockchain wallet address</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="wallet-address">Wallet Address</Label>
                    <Input
                      id="wallet-address"
                      placeholder="0x..."
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleUpdateWalletAddress}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? 'Updating...' : 'Update Wallet Address'}
                  </Button>
                </CardContent>
              </Card>

              {walletData && (
                <Card>
                  <CardHeader>
                    <CardTitle>Balance Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Incoming</p>
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(walletData.statistics.total_incoming_value)}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Outgoing</p>
                        <p className="text-lg font-bold text-red-600">
                          {formatCurrency(walletData.statistics.total_outgoing_value)}
                        </p>
                      </div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Current Inventory</p>
                      <p className="text-lg font-bold text-blue-600">
                        {formatCurrency(walletData.statistics.current_inventory_value)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {walletData.statistics.current_batches_count} batches
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Transaction History</CardTitle>
                  <div className="flex space-x-2">
                    <Button
                      variant={transactionFilter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTransactionFilter('all')}
                    >
                      All
                    </Button>
                    <Button
                      variant={transactionFilter === 'incoming' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTransactionFilter('incoming')}
                    >
                      Incoming
                    </Button>
                    <Button
                      variant={transactionFilter === 'outgoing' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTransactionFilter('outgoing')}
                    >
                      Outgoing
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No transactions found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transactions.map((transaction, index) => (
                      <div key={transaction.id}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`w-3 h-3 rounded-full ${
                              transaction.direction === 'incoming' ? 'bg-green-500' : 'bg-red-500'
                            }`} />
                            <div>
                              <p className="font-medium">
                                {transaction.batch?.product_name} - {transaction.batch?.batch_id}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {transaction.direction === 'incoming' ? 'From' : 'To'}: {transaction.counterpart?.name} ({transaction.counterpart?.role})
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(transaction.transfer_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className={`font-bold ${
                            transaction.direction === 'incoming' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.direction === 'incoming' ? '+' : '-'}
                            {formatCurrency(parseFloat(transaction.price_transferred))}
                          </div>
                        </div>
                        {index < transactions.length - 1 && <Separator className="mt-4" />}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Earnings Tab */}
          <TabsContent value="earnings" className="space-y-6">
            {earnings ? (
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Sales by Product</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {earnings.sales_by_product.map((product: any, index: number) => (
                        <div key={index} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{product.product_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {product.transaction_count} sales, {product.total_quantity} units
                            </p>
                          </div>
                          <p className="font-bold">{formatCurrency(product.total_sales)}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-primary/10 rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Sales</p>
                        <p className="text-2xl font-bold">{earnings.total_transactions}</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Earnings</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(earnings.total_earnings)}
                        </p>
                      </div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Average per Sale</p>
                      <p className="text-xl font-bold text-blue-600">
                        {formatCurrency(earnings.average_per_transaction)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Earnings data not available for your role</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Notification Preferences</span>
                </CardTitle>
                <CardDescription>Choose which notifications you'd like to receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Batch Transfers</Label>
                      <p className="text-sm text-muted-foreground">Get notified when batches are transferred</p>
                    </div>
                    <Switch
                      checked={preferences.batch_transfers}
                      onCheckedChange={(value) => handleUpdatePreferences('batch_transfers', value)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Quality Updates</Label>
                      <p className="text-sm text-muted-foreground">Quality verification results</p>
                    </div>
                    <Switch
                      checked={preferences.quality_updates}
                      onCheckedChange={(value) => handleUpdatePreferences('quality_updates', value)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Expiry Warnings</Label>
                      <p className="text-sm text-muted-foreground">Batch expiration notifications</p>
                    </div>
                    <Switch
                      checked={preferences.expiry_warnings}
                      onCheckedChange={(value) => handleUpdatePreferences('expiry_warnings', value)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Price Alerts</Label>
                      <p className="text-sm text-muted-foreground">Market price changes</p>
                    </div>
                    <Switch
                      checked={preferences.price_alerts}
                      onCheckedChange={(value) => handleUpdatePreferences('price_alerts', value)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">System Updates</Label>
                      <p className="text-sm text-muted-foreground">Platform announcements and updates</p>
                    </div>
                    <Switch
                      checked={preferences.system_updates}
                      onCheckedChange={(value) => handleUpdatePreferences('system_updates', value)}
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h4 className="font-medium">Communication Channels</h4>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={preferences.email_notifications}
                      onCheckedChange={(value) => handleUpdatePreferences('email_notifications', value)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
                    </div>
                    <Switch
                      checked={preferences.sms_notifications}
                      onCheckedChange={(value) => handleUpdatePreferences('sms_notifications', value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
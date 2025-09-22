import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  Wallet, 
  CreditCard, 
  ArrowLeft, 
  Banknote, 
  PlusCircle,
  MinusCircle,
  History
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: string;
}

// Mock data
const mockTransactions: Transaction[] = [
  {
    id: 'TXN001',
    type: 'credit',
    amount: 250.00,
    description: 'Payment for Apples - Batch BTH001',
    date: '2024-01-16'
  },
  {
    id: 'TXN002', 
    type: 'debit',
    amount: 50.00,
    description: 'Balance top-up fee',
    date: '2024-01-15'
  },
  {
    id: 'TXN003',
    type: 'credit',
    amount: 180.75,
    description: 'Payment for Tomatoes - Batch BTH002',
    date: '2024-01-14'
  }
];

export default function Profile() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [transactions] = useState<Transaction[]>(mockTransactions);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [topUpAmount, setTopUpAmount] = useState('');

  const mockBalance = user?.role === 'farmer' ? 1825.50 : 
                     user?.role === 'distributor' ? 2450.75 : 1850.25;

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (amount > 0 && amount <= mockBalance) {
      toast({
        title: "Withdrawal Initiated",
        description: `$${amount.toFixed(2)} will be transferred to your bank account within 2-3 business days.`,
      });
      setWithdrawAmount('');
    } else {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount within your available balance.",
        variant: "destructive"
      });
    }
  };

  const handleTopUp = () => {
    const amount = parseFloat(topUpAmount);
    if (amount > 0) {
      toast({
        title: "Top-up Initiated",
        description: `$${amount.toFixed(2)} will be added to your balance after payment confirmation.`,
      });
      setTopUpAmount('');
    } else {
      toast({
        title: "Invalid Amount", 
        description: "Please enter a valid amount to top up.",
        variant: "destructive"
      });
    }
  };

  const handleRequestFunds = () => {
    toast({
      title: "Fund Request Sent",
      description: "Your request for additional funding has been submitted for review.",
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'farmer': return 'bg-green-500';
      case 'distributor': return 'bg-blue-500';
      case 'retailer': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'farmer': return 'secondary';
      case 'distributor': return 'default';
      case 'retailer': return 'outline';
      default: return 'default';
    }
  };

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
                <h1 className="text-2xl font-bold text-foreground">Profile</h1>
              </div>
            </div>
            
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Personal Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Personal Information</span>
                </CardTitle>
                <CardDescription>Your account details and role information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={user?.name || ''} readOnly />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" value={user?.email || ''} readOnly />
                </div>
                
                <div className="space-y-2">
                  <Label>Role</Label>
                  <div>
                    <Badge variant={getRoleBadgeVariant(user?.role || '')}>
                      {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Balance Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wallet className="h-5 w-5" />
                  <span>Wallet Balance</span>
                </CardTitle>
                <CardDescription>Your current account balance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <div className="text-4xl font-bold text-primary mb-2">
                    ${mockBalance.toFixed(2)}
                  </div>
                  <p className="text-muted-foreground">Available Balance</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Actions */}
          <div className="space-y-6">
            {/* Role-specific actions */}
            {user?.role === 'farmer' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MinusCircle className="h-5 w-5" />
                    <span>Withdraw Funds</span>
                  </CardTitle>
                  <CardDescription>Transfer money to your bank account</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="withdraw">Withdrawal Amount</Label>
                    <Input
                      id="withdraw"
                      type="number"
                      placeholder="0.00"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleWithdraw} className="w-full" variant="gradient">
                    <Banknote className="h-4 w-4 mr-2" />
                    Withdraw Funds
                  </Button>
                </CardContent>
              </Card>
            )}

            {(user?.role === 'distributor' || user?.role === 'retailer') && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PlusCircle className="h-5 w-5" />
                    <span>Manage Balance</span>
                  </CardTitle>
                  <CardDescription>Add funds or request additional credit</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="topup">Top-up Amount</Label>
                    <Input
                      id="topup"
                      type="number"
                      placeholder="0.00"
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={handleTopUp} variant="gradient">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Top Up
                    </Button>
                    <Button onClick={handleRequestFunds} variant="outline">
                      Request Funds
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Transaction History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <History className="h-5 w-5" />
                  <span>Recent Transactions</span>
                </CardTitle>
                <CardDescription>Your latest financial activity</CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No transactions yet</p>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((transaction, index) => (
                      <div key={transaction.id}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-2 h-2 rounded-full ${
                              transaction.type === 'credit' ? 'bg-green-500' : 'bg-red-500'
                            }`} />
                            <div>
                              <p className="font-medium">{transaction.description}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(transaction.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className={`font-semibold ${
                            transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'credit' ? '+' : '-'}${transaction.amount.toFixed(2)}
                          </div>
                        </div>
                        {index < transactions.length - 1 && <Separator className="mt-3" />}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
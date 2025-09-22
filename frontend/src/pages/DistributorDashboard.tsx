import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiClient, Batch, User } from '@/lib/api';
import { QrCode, Eye, Wallet, User as UserIcon, Package, Truck, DollarSign, ShoppingCart, Send, ArrowUpDown, LogOut } from 'lucide-react';

export default function DistributorDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  
  const [batches, setBatches] = useState<Batch[]>([]);
  const [statistics, setStatistics] = useState<any>({});
  const [potentialBuyers, setPotentialBuyers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSellDialog, setShowSellDialog] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [qrInput, setQrInput] = useState('');
  const [otp, setOtp] = useState('');

  const [sellData, setSellData] = useState({
    buyer_id: '',
    price: '',
    notes: '',
    otp_input: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const [batchesRes, statsRes, buyersRes] = await Promise.all([
        apiClient.getUserBatches(),
        apiClient.getDashboardStats(),
        apiClient.getPotentialBuyers()
      ]);
      
      if (batchesRes.success) {
        setBatches(batchesRes.data.current_batches);
      }
      
      if (statsRes.success) {
        setStatistics(statsRes.data.statistics);
      }
      
      if (buyersRes.success) {
        setPotentialBuyers(buyersRes.data.buyers);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanQR = async () => {
    if (!qrInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter a batch ID to scan/verify",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiClient.getBatch(qrInput.trim());
      
      if (response.success) {
        const batch = response.data.batch;
        const transferHistory = response.data.transfer_history;
        
        toast({
          title: "QR Code Verified ✓",
          description: `Batch: ${batch.product_name} from ${batch.origin_farm}. Quantity: ${batch.quantity} ${batch.unit}`,
        });
        
        // Show detailed information in a dialog or card
        console.log('Batch verified:', batch, transferHistory);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid batch ID or batch not found",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setShowQRScanner(false);
      setQrInput('');
    }
  };

  const handleGenerateOTP = async () => {
    try {
      const response = await apiClient.generateOTP('sell');
      if (response.success) {
        setOtp(response.data.otp);
        toast({
          title: "OTP Generated",
          description: `Your OTP is: ${response.data.otp} (Valid for 5 minutes)`
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate OTP",
        variant: "destructive"
      });
    }
  };

  const handleSellBatch = async () => {
    if (!selectedBatch || !sellData.buyer_id || !sellData.price || !sellData.otp_input) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await apiClient.transferBatch(selectedBatch.batch_id, {
        to_user_id: sellData.buyer_id,
        transfer_price: parseFloat(sellData.price),
        notes: sellData.notes,
        otp: sellData.otp_input
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Batch transferred successfully!"
        });
        
        setShowSellDialog(false);
        setSelectedBatch(null);
        setSellData({ buyer_id: '', price: '', notes: '', otp_input: '' });
        setOtp('');
        loadData();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to transfer batch",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'harvested': return 'bg-green-500';
      case 'in_transit': return 'bg-yellow-500';
      case 'delivered': return 'bg-blue-500';
      case 'sold': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'harvested': return 'default';
      case 'in_transit': return 'secondary';
      case 'delivered': return 'outline';
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
              <div className="flex items-center space-x-2">
                <Truck className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">Distributor Dashboard</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-2 bg-gradient-primary rounded-lg text-white">
                <Wallet className="h-4 w-4" />
                <span className="font-semibold">${(statistics.profit_margin || 0).toFixed(2)}</span>
              </div>
              
              <div className="flex items-center space-x-2 px-3 py-2 bg-card rounded-lg border">
                <UserIcon className="h-4 w-4" />
                <span className="font-medium">{user?.name}</span>
              </div>
              
              <Button variant="outline" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Current Inventory</p>
                  <p className="text-2xl font-bold">{statistics.current_inventory || 0}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Purchases</p>
                  <p className="text-2xl font-bold">{statistics.total_purchases || 0}</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
                  <p className="text-2xl font-bold">{statistics.total_sales || 0}</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Profit Margin</p>
                  <p className="text-2xl font-bold">${(statistics.profit_margin || 0).toFixed(2)}</p>
                </div>
                <ArrowUpDown className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="flex space-x-4">
            <Button 
              onClick={() => setShowQRScanner(true)} 
              className="flex items-center space-x-2"
              variant="gradient"
            >
              <QrCode className="h-4 w-4" />
              <span>Scan/Verify QR Code</span>
            </Button>
            
            <Button variant="outline" className="flex items-center space-x-2">
              <Eye className="h-4 w-4" />
              <span>View Profile</span>
            </Button>
          </div>
        </div>

        {/* Inventory */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Current Inventory ({batches.length})</h2>
          </div>

          {batches.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Inventory Yet</h3>
                <p className="text-muted-foreground">Purchase batches from farmers to start building your inventory</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {batches.map((batch) => (
                <Card key={batch.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{batch.product_name}</CardTitle>
                      <Badge variant={getStatusBadgeVariant(batch.status)} className={`${getStatusColor(batch.status)} text-white`}>
                        {batch.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <CardDescription>Batch ID: {batch.batch_id}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Quantity</p>
                        <p className="font-medium">{batch.quantity} {batch.unit}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Price/Unit</p>
                        <p className="font-medium">${batch.price_per_unit}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Origin</p>
                        <p className="font-medium">{batch.origin_farm}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Harvest Date</p>
                        <p className="font-medium">{new Date(batch.harvest_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div className="pt-2 space-y-2">
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => toast({
                            title: "Batch Details",
                            description: `Total Value: $${(batch.quantity * batch.price_per_unit).toFixed(2)}`,
                          })}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                        
                        {batch.status === 'in_transit' && (
                          <Button 
                            variant="gradient" 
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              setSelectedBatch(batch);
                              setShowSellDialog(true);
                            }}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Transfer
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* QR Scanner Dialog */}
        <Dialog open={showQRScanner} onOpenChange={setShowQRScanner}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Scan QR Code / Verify Batch</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="qr-input">Enter Batch ID</Label>
                <Input
                  id="qr-input"
                  placeholder="Enter batch ID or scan QR code"
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                />
              </div>
              
              <div className="flex space-x-3">
                <Button 
                  onClick={handleScanQR} 
                  variant="gradient" 
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? 'Verifying...' : 'Verify Batch'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowQRScanner(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Sell Dialog */}
        <Dialog open={showSellDialog} onOpenChange={setShowSellDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Transfer Batch - {selectedBatch?.batch_id}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="buyer">Select Buyer</Label>
                <select 
                  className="w-full px-3 py-2 border rounded-md"
                  value={sellData.buyer_id} 
                  onChange={(e) => setSellData(prev => ({ ...prev, buyer_id: e.target.value }))}
                >
                  <option value="">Select a retailer</option>
                  {potentialBuyers.map((buyer) => (
                    <option key={buyer.id} value={buyer.id}>
                      {buyer.name} ({buyer.role})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price">Transfer Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={sellData.price}
                  onChange={(e) => setSellData(prev => ({ ...prev, price: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes about the transfer"
                  value={sellData.notes}
                  onChange={(e) => setSellData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="otp">OTP for Digital Signature</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={handleGenerateOTP}
                  >
                    Generate OTP
                  </Button>
                </div>
                <Input
                  id="otp"
                  placeholder="Enter OTP"
                  value={sellData.otp_input}
                  onChange={(e) => setSellData(prev => ({ ...prev, otp_input: e.target.value }))}
                />
                {otp && (
                  <p className="text-sm text-green-600">Generated OTP: {otp}</p>
                )}
              </div>
              
              <div className="flex space-x-3">
                <Button 
                  onClick={handleSellBatch} 
                  variant="gradient" 
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? 'Processing...' : 'Complete Transfer'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowSellDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
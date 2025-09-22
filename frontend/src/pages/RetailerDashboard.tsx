import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiClient, Batch } from '@/lib/api';
import { QrCode, Eye, Wallet, User as UserIcon, Package, Store, DollarSign, ShoppingCart, CheckCircle, LogOut } from 'lucide-react';

export default function RetailerDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  
  const [batches, setBatches] = useState<Batch[]>([]);
  const [statistics, setStatistics] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showBatchDetails, setShowBatchDetails] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [qrInput, setQrInput] = useState('');
  const [batchDetails, setBatchDetails] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const [batchesRes, statsRes] = await Promise.all([
        apiClient.getUserBatches(),
        apiClient.getDashboardStats()
      ]);
      
      if (batchesRes.success) {
        setBatches(batchesRes.data.current_batches);
      }
      
      if (statsRes.success) {
        setStatistics(statsRes.data.statistics);
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
        
        setBatchDetails({ batch, transferHistory });
        setShowBatchDetails(true);
        
        toast({
          title: "QR Code Verified ✓",
          description: `Batch: ${batch.product_name} from ${batch.origin_farm}`,
        });
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

  const handleMarkAsSold = async (batch: Batch) => {
    try {
      setIsLoading(true);
      
      // In a real implementation, you might want to track consumer sales
      // For now, we'll just show a success message
      toast({
        title: "Success",
        description: `${batch.product_name} batch marked as sold to consumer`,
      });
      
      // Refresh data
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark batch as sold",
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
                <Store className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">Retailer Dashboard</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-2 bg-gradient-primary rounded-lg text-white">
                <Wallet className="h-4 w-4" />
                <span className="font-semibold">${(statistics.purchase_value || 0).toFixed(2)}</span>
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
                  <p className="text-sm font-medium text-muted-foreground">Current Stock</p>
                  <p className="text-2xl font-bold">{statistics.current_stock || 0}</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Purchase Value</p>
                  <p className="text-2xl font-bold">${(statistics.purchase_value || 0).toFixed(2)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ready for Sale</p>
                  <p className="text-2xl font-bold">{statistics.ready_for_sale || 0}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-orange-600" />
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
              <span>Scan QR Code for Consumer</span>
            </Button>
            
            <Button variant="outline" className="flex items-center space-x-2">
              <Eye className="h-4 w-4" />
              <span>View Profile</span>
            </Button>
          </div>
        </div>

        {/* Current Stock */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Current Stock ({batches.length})</h2>
          </div>

          {batches.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Stock Available</h3>
                <p className="text-muted-foreground">Purchase products from distributors to start building your inventory</p>
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
                        <p className="text-muted-foreground">Total Value</p>
                        <p className="font-medium">${(batch.quantity * batch.price_per_unit).toFixed(2)}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Origin</p>
                        <p className="font-medium">{batch.origin_farm}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Quality</p>
                        <p className="font-medium">{batch.quality_grade || 'Standard'}</p>
                      </div>
                    </div>
                    
                    <div className="pt-2 space-y-2">
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => {
                            setSelectedBatch(batch);
                            setBatchDetails({ batch, transferHistory: [] });
                            setShowBatchDetails(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                        
                        {batch.status === 'delivered' && (
                          <Button 
                            variant="gradient" 
                            size="sm"
                            className="flex-1"
                            onClick={() => handleMarkAsSold(batch)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Mark Sold
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
              <DialogTitle>Scan QR Code for Consumer Verification</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Scan the QR code to show consumers the complete journey of their produce from farm to store.
              </p>
              
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
                  {isLoading ? 'Verifying...' : 'Show Journey'}
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

        {/* Batch Details Dialog */}
        <Dialog open={showBatchDetails} onOpenChange={setShowBatchDetails}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Supply Chain Journey - {batchDetails?.batch?.batch_id}</DialogTitle>
            </DialogHeader>
            
            {batchDetails && (
              <div className="space-y-6">
                {/* Batch Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Product Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Product</p>
                        <p className="text-lg font-semibold">{batchDetails.batch.product_name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Origin Farm</p>
                        <p className="text-lg font-semibold">{batchDetails.batch.origin_farm}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Harvest Date</p>
                        <p className="font-medium">{new Date(batchDetails.batch.harvest_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Quantity</p>
                        <p className="font-medium">{batchDetails.batch.quantity} {batchDetails.batch.unit}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Quality Grade</p>
                        <p className="font-medium">{batchDetails.batch.quality_grade || 'Standard'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Blockchain Hash</p>
                        <p className="font-mono text-xs break-all">{batchDetails.batch.blockchain_hash}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Transfer History */}
                {batchDetails.transferHistory && batchDetails.transferHistory.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Supply Chain Journey</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {batchDetails.transferHistory.map((transfer: any, index: number) => (
                          <div key={transfer.id} className="flex items-start space-x-4 pb-4 border-b last:border-b-0">
                            <div className="bg-primary/10 p-2 rounded-full">
                              <Package className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">
                                Transfer from {transfer.from_user?.name} ({transfer.from_user?.role}) 
                                to {transfer.to_user?.name} ({transfer.to_user?.role})
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Price: ${transfer.price_transferred} | 
                                Date: {new Date(transfer.transfer_date).toLocaleDateString()}
                              </p>
                              {transfer.notes && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  Notes: {transfer.notes}
                                </p>
                              )}
                              {transfer.blockchain_transaction_hash && (
                                <p className="text-xs font-mono text-muted-foreground mt-1">
                                  TX: {transfer.blockchain_transaction_hash}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex justify-end">
                  <Button onClick={() => setShowBatchDetails(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
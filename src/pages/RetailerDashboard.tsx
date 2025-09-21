import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { QrCode, Eye, Wallet, User, ShoppingCart, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InventoryItem {
  id: string;
  batchId: string;
  distributorId: string;
  distributorName: string;
  cropType: string;
  weight: number;
  receivedDate: string;
  expiryDate: string;
  status: 'received' | 'in-stock' | 'sold';
  sellPrice: number;
}

// Mock data
const mockInventory: InventoryItem[] = [
  {
    id: 'INV001',
    batchId: 'BTH001',
    distributorId: 'D001',
    distributorName: 'Fresh Distribution Co.',
    cropType: 'Apples',
    weight: 150,
    receivedDate: '2024-01-17',
    expiryDate: '2024-02-15',
    status: 'in-stock',
    sellPrice: 4.50
  },
  {
    id: 'INV002',
    batchId: 'BTH005',
    distributorId: 'D002',
    distributorName: 'Green Supply Chain',
    cropType: 'Bananas',
    weight: 80,
    receivedDate: '2024-01-16',
    expiryDate: '2024-01-25',
    status: 'received',
    sellPrice: 3.20
  },
  {
    id: 'INV003',
    batchId: 'BTH003',
    distributorId: 'D001',
    distributorName: 'Fresh Distribution Co.',
    cropType: 'Oranges',
    weight: 120,
    receivedDate: '2024-01-12',
    expiryDate: '2024-02-10',
    status: 'sold',
    sellPrice: 5.00
  }
];

export default function RetailerDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [inventory] = useState<InventoryItem[]>(mockInventory);
  const [showQRScanner, setShowQRScanner] = useState(false);

  const mockBalance = 1850.25;

  const handleScanQR = () => {
    setShowQRScanner(true);
    // Mock QR scan result after 2 seconds
    setTimeout(() => {
      setShowQRScanner(false);
      toast({
        title: "Delivery Confirmed",
        description: "Batch BTH006 - Lettuce (45kg) received from Metro Distribution",
      });
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return 'bg-blue-500';
      case 'in-stock': return 'bg-green-500';
      case 'sold': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'received': return 'default';
      case 'in-stock': return 'secondary';
      case 'sold': return 'outline';
      default: return 'default';
    }
  };

  const totalValue = inventory
    .filter(item => item.status !== 'sold')
    .reduce((sum, item) => sum + (item.weight * item.sellPrice), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">Retailer Dashboard</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-2 bg-gradient-primary rounded-lg text-white">
                <Wallet className="h-4 w-4" />
                <span className="font-semibold">${mockBalance.toFixed(2)}</span>
              </div>
              
              <div className="flex items-center space-x-2 px-3 py-2 bg-card rounded-lg border">
                <User className="h-4 w-4" />
                <span className="font-medium">{user?.name}</span>
              </div>
              
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Inventory</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inventory.filter(i => i.status !== 'sold').length}</div>
              <p className="text-xs text-muted-foreground">Active items</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Current stock value</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Items Sold</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inventory.filter(i => i.status === 'sold').length}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="flex space-x-4">
            <Button 
              onClick={handleScanQR} 
              className="flex items-center space-x-2"
              variant="gradient"
              disabled={showQRScanner}
            >
              <QrCode className="h-4 w-4" />
              <span>{showQRScanner ? 'Scanning...' : 'Scan QR Code'}</span>
            </Button>
            
            <Button variant="outline" className="flex items-center space-x-2">
              <Eye className="h-4 w-4" />
              <span>View Profile</span>
            </Button>
          </div>
        </div>

        <Separator className="mb-8" />

        {/* Inventory */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Inventory ({inventory.length})</h2>
          </div>

          {inventory.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No inventory items yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {inventory.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{item.cropType}</CardTitle>
                      <Badge variant={getStatusBadgeVariant(item.status)}>
                        {item.status}
                      </Badge>
                    </div>
                    <CardDescription>Batch: {item.batchId}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Weight</p>
                        <p className="font-medium">{item.weight} kg</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Price/kg</p>
                        <p className="font-medium">${item.sellPrice}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Received</p>
                        <p className="font-medium">{new Date(item.receivedDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Expires</p>
                        <p className="font-medium">{new Date(item.expiryDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div className="text-sm">
                      <p className="text-muted-foreground">Distributor</p>
                      <p className="font-medium">{item.distributorName}</p>
                    </div>
                    
                    <div className="pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => toast({
                          title: "Item Details",
                          description: `Total Value: $${(item.weight * item.sellPrice).toFixed(2)}`,
                        })}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* QR Scanner Mock */}
        {showQRScanner && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-80">
              <CardHeader>
                <CardTitle>Scanning QR Code...</CardTitle>
              </CardHeader>
              <CardContent className="text-center py-8">
                <div className="animate-pulse">
                  <QrCode className="h-16 w-16 mx-auto mb-4 text-primary" />
                  <p className="text-muted-foreground">Point your camera at the QR code</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
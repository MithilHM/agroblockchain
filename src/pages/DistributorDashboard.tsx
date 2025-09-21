import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { QrCode, Eye, Wallet, User, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Batch {
  id: string;
  farmerId: string;
  farmerName: string;
  cropType: string;
  weight: number;
  harvestDate: string;
  assignedDate: string;
  status: 'assigned' | 'in-transit' | 'delivered';
  qrCode: string;
}

// Mock data
const mockBatches: Batch[] = [
  {
    id: 'BTH001',
    farmerId: 'F001',
    farmerName: 'John Farmer',
    cropType: 'Apples',
    weight: 150,
    harvestDate: '2024-01-15',
    assignedDate: '2024-01-16',
    status: 'assigned',
    qrCode: 'QR_BTH001_APPLES_150KG'
  },
  {
    id: 'BTH002',
    farmerId: 'F002', 
    farmerName: 'Sarah Green',
    cropType: 'Tomatoes',
    weight: 75,
    harvestDate: '2024-01-14',
    assignedDate: '2024-01-15',
    status: 'in-transit',
    qrCode: 'QR_BTH002_TOMATOES_75KG'
  },
  {
    id: 'BTH003',
    farmerId: 'F001',
    farmerName: 'John Farmer',
    cropType: 'Oranges',
    weight: 200,
    harvestDate: '2024-01-10',
    assignedDate: '2024-01-12',
    status: 'delivered',
    qrCode: 'QR_BTH003_ORANGES_200KG'
  }
];

export default function DistributorDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [batches] = useState<Batch[]>(mockBatches);
  const [showQRScanner, setShowQRScanner] = useState(false);

  const mockBalance = 2450.75;

  const handleScanQR = () => {
    setShowQRScanner(true);
    // Mock QR scan result after 2 seconds
    setTimeout(() => {
      setShowQRScanner(false);
      toast({
        title: "QR Code Scanned Successfully",
        description: "Batch BTH004 - Carrots (50kg) verified from Green Valley Farm",
      });
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-blue-500';
      case 'in-transit': return 'bg-yellow-500';
      case 'delivered': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'assigned': return 'default';
      case 'in-transit': return 'secondary';
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
                <Package className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">Distributor Dashboard</h1>
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

        {/* Assigned Batches */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Assigned Batches ({batches.length})</h2>
          </div>

          {batches.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No batches assigned yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {batches.map((batch) => (
                <Card key={batch.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{batch.cropType}</CardTitle>
                      <Badge variant={getStatusBadgeVariant(batch.status)}>
                        {batch.status}
                      </Badge>
                    </div>
                    <CardDescription>Batch ID: {batch.id}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Weight</p>
                        <p className="font-medium">{batch.weight} kg</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Farmer</p>
                        <p className="font-medium">{batch.farmerName}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Harvest Date</p>
                        <p className="font-medium">{new Date(batch.harvestDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Assigned</p>
                        <p className="font-medium">{new Date(batch.assignedDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => toast({
                          title: "Batch Details",
                          description: `QR Code: ${batch.qrCode}`,
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
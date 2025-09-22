import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { QRCodeModal } from '@/components/QRCodeModal';
import { Plus, Package, LogOut, User, QrCode, Sprout } from 'lucide-react';

interface Produce {
  id: string;
  type: string;
  weight: number;
  harvestDate: string;
  createdAt: string;
  farmerId?: string;
  farmerName?: string;
  farmLocation?: string;
}

const cropTypes = [
  { name: 'Apples', emoji: '🍎' },
  { name: 'Oranges', emoji: '🍊' },
  { name: 'Bananas', emoji: '🍌' },
  { name: 'Tomatoes', emoji: '🍅' },
  { name: 'Potatoes', emoji: '🥔' },
  { name: 'Carrots', emoji: '🥕' },
  { name: 'Lettuce', emoji: '🥬' },
  { name: 'Wheat', emoji: '🌾' },
  { name: 'Rice', emoji: '🍚' },
  { name: 'Corn', emoji: '🌽' }
];

export default function FarmerDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [produce, setProduce] = useState<Produce[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedProduce, setSelectedProduce] = useState<Produce | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [activeTab, setActiveTab] = useState('produce');
  const [formData, setFormData] = useState({
    type: '',
    weight: '',
    harvestDate: ''
  });

  const handleAddProduce = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.type || !formData.weight || !formData.harvestDate) return;

    const newProduce: Produce = {
      id: Math.random().toString(36).substr(2, 9),
      type: formData.type,
      weight: parseFloat(formData.weight),
      harvestDate: formData.harvestDate,
      createdAt: new Date().toISOString(),
      farmerId: user?.farmerId,
      farmerName: user?.name,
      farmLocation: user?.farmLocation
    };

    setProduce(prev => [newProduce, ...prev]);
    setFormData({ type: '', weight: '', harvestDate: '' });
    setShowAddForm(false);
    
    toast({
      title: "🎉 Produce Added Successfully!",
      description: `${formData.weight}kg of ${formData.type} has been registered. QR code ready! 📱`,
    });
  };

  const handleGenerateQR = (produceItem: Produce) => {
    setSelectedProduce(produceItem);
    setShowQRModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-secondary">
      {/* Header */}
      <header className="bg-gradient-primary shadow-medium">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Sprout className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">🚜 Farmer Dashboard</h1>
                <p className="text-white/80 text-sm">Welcome back, {user?.name}! 👨‍🌾</p>
                {user?.farmerId && (
                  <p className="text-white/60 text-xs">Farmer ID: {user.farmerId}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-white">
                <User className="h-4 w-4" />
                <span className="text-sm">{user?.email}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="produce" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              🌾 My Produce
            </TabsTrigger>
            <TabsTrigger value="qr-codes" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              📱 QR Codes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="produce" className="space-y-6">
            {/* Add Produce Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-foreground">🌾 My Produce</h2>
                <Button
                  variant="gradient"
                  onClick={() => setShowAddForm(!showAddForm)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  ➕ Add Produce
                </Button>
              </div>

              {showAddForm && (
                <Card className="mb-6 shadow-soft">
                  <CardHeader>
                    <CardTitle>📝 Register New Produce</CardTitle>
                    <CardDescription>
                      Add details about your harvested produce to the supply chain 🌱➡️📦
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddProduce} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="type">🌱 Crop Type</Label>
                          <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select crop type" />
                            </SelectTrigger>
                            <SelectContent>
                              {cropTypes.map((crop) => (
                                <SelectItem key={crop.name} value={crop.name}>
                                  {crop.emoji} {crop.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="weight">⚖️ Weight (kg)</Label>
                          <Input
                            id="weight"
                            type="number"
                            step="0.1"
                            placeholder="0.0"
                            value={formData.weight}
                            onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="harvestDate">📅 Harvest Date</Label>
                          <Input
                            id="harvestDate"
                            type="date"
                            value={formData.harvestDate}
                            onChange={(e) => setFormData(prev => ({ ...prev, harvestDate: e.target.value }))}
                            required
                          />
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <Button type="submit" variant="gradient">
                          🎯 Register Produce
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowAddForm(false)}
                        >
                          ❌ Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Produce List */}
            <div className="grid gap-4">
              {produce.length === 0 ? (
                <Card className="text-center py-12 shadow-soft">
                  <CardContent>
                    <Sprout className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">🌱 No Produce Registered Yet</h3>
                    <p className="text-muted-foreground mb-4">Start by adding your first batch of produce to the system! 🚜</p>
                    <Button variant="gradient" onClick={() => setShowAddForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      ➕ Add Your First Produce
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                produce.map((item) => {
                  const cropEmoji = cropTypes.find(crop => crop.name === item.type)?.emoji || '🌱';
                  return (
                    <Card key={item.id} className="shadow-soft hover:shadow-medium transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="bg-gradient-accent p-3 rounded-lg text-2xl">
                              {cropEmoji}
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                {cropEmoji} {item.type}
                              </h3>
                              <p className="text-muted-foreground">
                                ⚖️ Weight: {item.weight}kg | 📅 Harvested: {new Date(item.harvestDate).toLocaleDateString()}
                              </p>
                              {item.farmLocation && (
                                <p className="text-sm text-muted-foreground">📍 {item.farmLocation}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGenerateQR(item)}
                            >
                              <QrCode className="h-4 w-4 mr-2" />
                              📱 QR Code
                            </Button>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Registered</p>
                              <p className="text-sm font-medium text-foreground">
                                {new Date(item.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="qr-codes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>📱 QR Code Gallery</CardTitle>
                <CardDescription>
                  View and manage QR codes for all your registered produce 🌾📱
                </CardDescription>
              </CardHeader>
              <CardContent>
                {produce.length === 0 ? (
                  <div className="text-center py-8">
                    <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">📱 No QR Codes Yet</h3>
                    <p className="text-muted-foreground">Add some produce to generate QR codes! 🌱</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {produce.map((item) => {
                      const cropEmoji = cropTypes.find(crop => crop.name === item.type)?.emoji || '🌱';
                      return (
                        <Card key={item.id} className="text-center hover:shadow-medium transition-shadow">
                          <CardContent className="p-4">
                            <div className="text-4xl mb-2">{cropEmoji}</div>
                            <h4 className="font-semibold mb-1">{item.type}</h4>
                            <p className="text-sm text-muted-foreground mb-3">
                              {item.weight}kg • {new Date(item.harvestDate).toLocaleDateString()}
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGenerateQR(item)}
                              className="w-full"
                            >
                              <QrCode className="h-4 w-4 mr-2" />
                              📱 View QR
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* QR Code Modal */}
        <QRCodeModal
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
          produce={selectedProduce}
        />
      </div>
    </div>
  );
}
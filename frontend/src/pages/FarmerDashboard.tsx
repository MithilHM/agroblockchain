import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiClient, Batch, User } from '@/lib/api';
import { Plus, Package, LogOut, User as UserIcon, QrCode, DollarSign, Truck, Eye, Send } from 'lucide-react';

const cropTypes = [
  'Apples', 'Oranges', 'Bananas', 'Tomatoes', 'Potatoes', 
  'Carrots', 'Lettuce', 'Wheat', 'Rice', 'Corn', 'Onions',
  'Spinach', 'Cabbage', 'Broccoli', 'Cauliflower'
];

const units = ['kg', 'lbs', 'tons', 'boxes', 'crates'];

export default function FarmerDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  
  const [batches, setBatches] = useState<Batch[]>([]);
  const [statistics, setStatistics] = useState<any>({});
  const [potentialBuyers, setPotentialBuyers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSellDialog, setShowSellDialog] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [otp, setOtp] = useState('');
  
  const [formData, setFormData] = useState({
    product_name: '',
    origin_farm: '',
    harvest_date: '',
    quantity: '',
    unit: 'kg',
    quality_grade: '',
    price_per_unit: '',
    geo_location: ''
  });

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
      
      // Load batches and stats
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

  const handleRegisterBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.product_name || !formData.origin_farm || !formData.harvest_date || 
        !formData.quantity || !formData.price_per_unit) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await apiClient.registerBatch({
        product_name: formData.product_name,
        origin_farm: formData.origin_farm,
        harvest_date: formData.harvest_date,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        quality_grade: formData.quality_grade || undefined,
        price_per_unit: parseFloat(formData.price_per_unit),
        geo_location: formData.geo_location || undefined
      });

      if (response.success) {
        toast({
          title: "Success",
          description: `Batch ${response.data.batch.batch_id} registered successfully with QR code!`
        });
        
        // Reset form and reload data
        setFormData({
          product_name: '',
          origin_farm: '',
          harvest_date: '',
          quantity: '',
          unit: 'kg',
          quality_grade: '',
          price_per_unit: '',
          geo_location: ''
        });
        setShowAddForm(false);
        loadData();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to register batch",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
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

  return (
    <div className="min-h-screen bg-gradient-secondary">
      {/* Header */}
      <header className="bg-gradient-primary shadow-medium">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">Farmer Dashboard</h1>
                <p className="text-white/80 text-sm">Welcome back, {user?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-white">
                <UserIcon className="h-4 w-4" />
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
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Batches</p>
                  <p className="text-2xl font-bold">{statistics.total_batches_registered || 0}</p>
                </div>
                <Package className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Batches Sold</p>
                  <p className="text-2xl font-bold">{statistics.batches_sold || 0}</p>
                </div>
                <Truck className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">${statistics.total_revenue || 0}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Listings</p>
                  <p className="text-2xl font-bold">{statistics.active_listings || 0}</p>
                </div>
                <Eye className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Produce Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">My Produce Batches</h2>
            <Button
              variant="gradient"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Register New Batch
            </Button>
          </div>

          {showAddForm && (
            <Card className="mb-6 shadow-soft">
              <CardHeader>
                <CardTitle>Register New Produce Batch</CardTitle>
                <CardDescription>
                  Add details about your harvested produce to the blockchain supply chain
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegisterBatch} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="product_name">Product Name</Label>
                      <Select value={formData.product_name} onValueChange={(value) => setFormData(prev => ({ ...prev, product_name: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {cropTypes.map((crop) => (
                            <SelectItem key={crop} value={crop}>{crop}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="origin_farm">Origin Farm</Label>
                      <Input
                        id="origin_farm"
                        placeholder="Farm name or location"
                        value={formData.origin_farm}
                        onChange={(e) => setFormData(prev => ({ ...prev, origin_farm: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="harvest_date">Harvest Date</Label>
                      <Input
                        id="harvest_date"
                        type="date"
                        value={formData.harvest_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, harvest_date: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        value={formData.quantity}
                        onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="unit">Unit</Label>
                      <Select value={formData.unit} onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map((unit) => (
                            <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="price_per_unit">Price per Unit ($)</Label>
                      <Input
                        id="price_per_unit"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.price_per_unit}
                        onChange={(e) => setFormData(prev => ({ ...prev, price_per_unit: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="quality_grade">Quality Grade (Optional)</Label>
                      <Select value={formData.quality_grade} onValueChange={(value) => setFormData(prev => ({ ...prev, quality_grade: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A+">A+ (Premium)</SelectItem>
                          <SelectItem value="A">A (High)</SelectItem>
                          <SelectItem value="B">B (Good)</SelectItem>
                          <SelectItem value="C">C (Standard)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="geo_location">Location (Optional)</Label>
                      <Input
                        id="geo_location"
                        placeholder="GPS coordinates or address"
                        value={formData.geo_location}
                        onChange={(e) => setFormData(prev => ({ ...prev, geo_location: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button type="submit" variant="gradient" disabled={isLoading}>
                      {isLoading ? 'Registering...' : 'Register Batch'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Batch List */}
        <div className="grid gap-4">
          {batches.length === 0 ? (
            <Card className="text-center py-12 shadow-soft">
              <CardContent>
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Batches Registered Yet</h3>
                <p className="text-muted-foreground mb-4">Start by adding your first batch of produce to the system.</p>
                <Button variant="gradient" onClick={() => setShowAddForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Register Your First Batch
                </Button>
              </CardContent>
            </Card>
          ) : (
            batches.map((batch) => (
              <Card key={batch.id} className="shadow-soft hover:shadow-medium transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-gradient-accent p-3 rounded-lg">
                        <Package className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{batch.product_name}</h3>
                        <p className="text-muted-foreground">
                          Batch ID: {batch.batch_id} | {batch.quantity} {batch.unit} | ${batch.price_per_unit}/{batch.unit}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Origin: {batch.origin_farm} | Harvest: {new Date(batch.harvest_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Badge variant="secondary" className={`${getStatusColor(batch.status)} text-white`}>
                        {batch.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      
                      {batch.qr_code_url && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <QrCode className="h-4 w-4 mr-2" />
                              QR Code
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>QR Code - {batch.batch_id}</DialogTitle>
                            </DialogHeader>
                            <div className="text-center p-4">
                              <img 
                                src={batch.qr_code_url} 
                                alt={`QR Code for ${batch.batch_id}`}
                                className="mx-auto max-w-full h-auto"
                              />
                              <p className="mt-4 text-sm text-muted-foreground">
                                Share this QR code with buyers to verify authenticity
                              </p>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      
                      {batch.status === 'harvested' && (
                        <Button 
                          variant="gradient" 
                          size="sm"
                          onClick={() => {
                            setSelectedBatch(batch);
                            setShowSellDialog(true);
                          }}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Sell
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Sell Dialog */}
        <Dialog open={showSellDialog} onOpenChange={setShowSellDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Sell Batch - {selectedBatch?.batch_id}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="buyer">Select Buyer</Label>
                <Select value={sellData.buyer_id} onValueChange={(value) => setSellData(prev => ({ ...prev, buyer_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a distributor" />
                  </SelectTrigger>
                  <SelectContent>
                    {potentialBuyers.map((buyer) => (
                      <SelectItem key={buyer.id} value={buyer.id}>
                        {buyer.name} ({buyer.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price">Sale Price ($)</Label>
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
                  {isLoading ? 'Processing...' : 'Complete Sale'}
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
      </div>
    </div>
  );
}
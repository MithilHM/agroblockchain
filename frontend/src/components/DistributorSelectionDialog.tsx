import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import { Star, MapPin, Clock, Package } from 'lucide-react';

interface Distributor {
  id: string;
  name: string;
  email: string;
  wallet_address: string;
  statistics: {
    current_inventory_count: number;
    current_inventory_value: number;
    recent_transactions: number;
    average_rating: number;
    experience_months: number;
  };
  specialties: string[];
}

interface DistributorSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  batchId: string;
  batchData: {
    batch_id: string;
    product_name: string;
    quantity: number;
    price_per_unit: number;
  };
  onSuccess: () => void;
}

export default function DistributorSelectionDialog({
  isOpen,
  onClose,
  batchId,
  batchData,
  onSuccess
}: DistributorSelectionDialogProps) {
  const { toast } = useToast();
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [selectedDistributors, setSelectedDistributors] = useState<string[]>([]);
  const [offerPrice, setOfferPrice] = useState(batchData.price_per_unit.toString());
  const [expiryHours, setExpiryHours] = useState('24');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadDistributors();
    }
  }, [isOpen, batchData.product_name]);

  const loadDistributors = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get(`/api/distributor/available?product_type=${batchData.product_name}`);
      
      if (response.success) {
        setDistributors(response.data.distributors);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load distributors",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDistributorToggle = (distributorId: string) => {
    setSelectedDistributors(prev => 
      prev.includes(distributorId)
        ? prev.filter(id => id !== distributorId)
        : [...prev, distributorId]
    );
  };

  const handleSendOffers = async () => {
    if (selectedDistributors.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one distributor",
        variant: "destructive"
      });
      return;
    }

    if (!offerPrice || parseFloat(offerPrice) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid offer price",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await apiClient.post('/api/distributor/offer', {
        batch_id: batchId,
        distributor_ids: selectedDistributors,
        offer_price: parseFloat(offerPrice),
        expiry_hours: parseInt(expiryHours),
        notes
      });

      if (response.success) {
        toast({
          title: "Success",
          description: `Offers sent to ${selectedDistributors.length} distributors`
        });
        onSuccess();
        onClose();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send offers",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRatingStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-4 w-4 ${i < fullStars ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
        />
      );
    }
    return stars;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Select Distributors for {batchData.product_name}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* Distributor List */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Available Distributors ({distributors.length})</h3>
                <Badge variant="outline">
                  {selectedDistributors.length} selected
                </Badge>
              </div>
              
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading distributors...</p>
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {distributors.map((distributor) => (
                      <Card 
                        key={distributor.id}
                        className={`cursor-pointer transition-all ${
                          selectedDistributors.includes(distributor.id) 
                            ? 'ring-2 ring-primary bg-primary/5' 
                            : 'hover:shadow-md'
                        }`}
                        onClick={() => handleDistributorToggle(distributor.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <Checkbox
                              checked={selectedDistributors.includes(distributor.id)}
                              onChange={() => handleDistributorToggle(distributor.id)}
                            />
                            
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold">{distributor.name}</h4>
                                <div className="flex space-x-1">
                                  {renderRatingStars(distributor.statistics.average_rating)}
                                </div>
                              </div>
                              
                              <p className="text-sm text-muted-foreground">{distributor.email}</p>
                              
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center space-x-1">
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                  <span>{distributor.statistics.current_inventory_count} batches</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span>{distributor.statistics.experience_months} months exp</span>
                                </div>
                              </div>
                              
                              {distributor.specialties.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {distributor.specialties.slice(0, 3).map((specialty, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {specialty}
                                    </Badge>
                                  ))}
                                  {distributor.specialties.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{distributor.specialties.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              )}
                              
                              <div className="text-sm text-muted-foreground">
                                <span>Portfolio: ${distributor.statistics.current_inventory_value.toFixed(0)}</span>
                                <span className="mx-2">•</span>
                                <span>{distributor.statistics.recent_transactions} recent deals</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
          
          {/* Offer Configuration */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Batch Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-sm text-muted-foreground">Product</Label>
                  <p className="font-medium">{batchData.product_name}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Quantity</Label>
                  <p className="font-medium">{batchData.quantity} units</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Base Price</Label>
                  <p className="font-medium">${batchData.price_per_unit}/unit</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Offer Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="offer-price">Offer Price per Unit ($)</Label>
                  <Input
                    id="offer-price"
                    type="number"
                    step="0.01"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expiry-hours">Offer Expiry (hours)</Label>
                  <Input
                    id="expiry-hours"
                    type="number"
                    value={expiryHours}
                    onChange={(e) => setExpiryHours(e.target.value)}
                    placeholder="24"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="offer-notes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="offer-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special terms or conditions..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
            
            <div className="flex space-x-3">
              <Button
                onClick={handleSendOffers}
                disabled={isSubmitting || selectedDistributors.length === 0}
                className="flex-1"
              >
                {isSubmitting ? 'Sending...' : `Send Offers (${selectedDistributors.length})`}
              </Button>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
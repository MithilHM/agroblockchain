import { useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Share2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode';

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

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  produce: Produce | null;
}

export function QRCodeModal({ isOpen, onClose, produce }: QRCodeModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && produce && canvasRef.current) {
      generateQRCode();
    }
  }, [isOpen, produce]);

  const generateQRCode = async () => {
    if (!produce || !canvasRef.current) return;

    const produceData = {
      id: produce.id,
      type: produce.type,
      weight: produce.weight,
      harvestDate: produce.harvestDate,
      createdAt: produce.createdAt,
      farmerId: produce.farmerId,
      farmerName: produce.farmerName,
      farmLocation: produce.farmLocation,
      verified: true,
      blockchain_hash: `0x${Math.random().toString(16).substr(2, 40)}` // Mock hash
    };

    try {
      await QRCode.toCanvas(canvasRef.current, JSON.stringify(produceData), {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: "QR Code Generation Failed",
        description: "Unable to generate QR code. Please try again.",
        variant: "destructive",
      });
    }
  };

  const downloadQRCode = () => {
    if (!canvasRef.current || !produce) return;

    const link = document.createElement('a');
    link.download = `${produce.type}_${produce.id}_QR.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();

    toast({
      title: "QR Code Downloaded! 📥",
      description: "QR code has been saved to your device.",
    });
  };

  const copyProduceData = () => {
    if (!produce) return;

    const produceData = {
      id: produce.id,
      type: produce.type,
      weight: produce.weight,
      harvestDate: produce.harvestDate,
      farmerId: produce.farmerId,
      farmerName: produce.farmerName,
      farmLocation: produce.farmLocation
    };

    navigator.clipboard.writeText(JSON.stringify(produceData, null, 2));
    toast({
      title: "Data Copied! 📋",
      description: "Produce details copied to clipboard.",
    });
  };

  if (!produce) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            📱 QR Code for {produce.type}
          </DialogTitle>
          <DialogDescription>
            Scan this QR code to verify product authenticity and track its journey! 🌾➡️📱
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* QR Code Display */}
          <Card>
            <CardContent className="flex flex-col items-center p-6">
              <canvas
                ref={canvasRef}
                className="border rounded-lg shadow-sm"
              />
              <p className="text-sm text-muted-foreground mt-2 text-center">
                🔍 Scan with any QR code reader to view product details
              </p>
            </CardContent>
          </Card>

          {/* Product Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                📦 Product Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">🆔 Product ID:</span>
                <span className="font-mono">{produce.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">🌾 Type:</span>
                <span>{produce.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">⚖️ Weight:</span>
                <span>{produce.weight}kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">📅 Harvest Date:</span>
                <span>{new Date(produce.harvestDate).toLocaleDateString()}</span>
              </div>
              {produce.farmerId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">👨‍🌾 Farmer ID:</span>
                  <span className="font-mono">{produce.farmerId}</span>
                </div>
              )}
              {produce.farmLocation && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">📍 Farm Location:</span>
                  <span>{produce.farmLocation}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={downloadQRCode} className="flex-1" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              📥 Download
            </Button>
            <Button onClick={copyProduceData} className="flex-1" variant="outline">
              <Copy className="h-4 w-4 mr-2" />
              📋 Copy Data
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
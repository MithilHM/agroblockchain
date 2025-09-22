import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Loader2 } from 'lucide-react';

interface GeolocationInputProps {
  onLocationUpdate: (location: {
    latitude: number;
    longitude: number;
    address?: string;
    accuracy?: number;
  }) => void;
  disabled?: boolean;
}

export default function GeolocationInput({ onLocationUpdate, disabled }: GeolocationInputProps) {
  const { toast } = useToast();
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
    address?: string;
    accuracy?: number;
  } | null>(null);
  const [manualCoords, setManualCoords] = useState({
    latitude: '',
    longitude: ''
  });

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive"
      });
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        // Try to get address from coordinates
        let address = '';
        try {
          const response = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=YOUR_API_KEY`
          );
          if (response.ok) {
            const data = await response.json();
            if (data.results && data.results.length > 0) {
              address = data.results[0].formatted;
            }
          }
        } catch (error) {
          console.log('Could not fetch address');
        }

        const locationData = {
          latitude,
          longitude,
          address: address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          accuracy
        };

        setCurrentLocation(locationData);
        onLocationUpdate(locationData);
        
        toast({
          title: "Location captured",
          description: `Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
        });
        
        setIsGettingLocation(false);
      },
      (error) => {
        let message = 'Could not get your location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out';
            break;
        }

        toast({
          title: "Location error",
          description: message,
          variant: "destructive"
        });
        
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const handleManualCoordinates = () => {
    const lat = parseFloat(manualCoords.latitude);
    const lng = parseFloat(manualCoords.longitude);

    if (isNaN(lat) || isNaN(lng)) {
      toast({
        title: "Invalid coordinates",
        description: "Please enter valid latitude and longitude",
        variant: "destructive"
      });
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast({
        title: "Invalid coordinates",
        description: "Latitude must be between -90 and 90, longitude between -180 and 180",
        variant: "destructive"
      });
      return;
    }

    const locationData = {
      latitude: lat,
      longitude: lng,
      address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    };

    setCurrentLocation(locationData);
    onLocationUpdate(locationData);
    
    toast({
      title: "Manual location set",
      description: `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Geolocation</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={getCurrentLocation}
          disabled={disabled || isGettingLocation}
        >
          {isGettingLocation ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <MapPin className="h-4 w-4 mr-2" />
          )}
          {isGettingLocation ? 'Getting Location...' : 'Auto-detect'}
        </Button>
      </div>

      {currentLocation && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">Location Captured</p>
              <p className="text-xs text-green-600">
                {currentLocation.address}
              </p>
              {currentLocation.accuracy && (
                <p className="text-xs text-green-600">
                  Accuracy: ±{Math.round(currentLocation.accuracy)}m
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Or enter coordinates manually:</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Input
              placeholder="Latitude"
              value={manualCoords.latitude}
              onChange={(e) => setManualCoords(prev => ({ ...prev, latitude: e.target.value }))}
              disabled={disabled}
            />
          </div>
          <div>
            <Input
              placeholder="Longitude"
              value={manualCoords.longitude}
              onChange={(e) => setManualCoords(prev => ({ ...prev, longitude: e.target.value }))}
              disabled={disabled}
            />
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleManualCoordinates}
          disabled={disabled || !manualCoords.latitude || !manualCoords.longitude}
          className="w-full"
        >
          Set Manual Coordinates
        </Button>
      </div>
    </div>
  );
}
import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { logger } from '../utils/logger';

interface GeolocationData {
  latitude: number;
  longitude: number;
  address?: string;
  timestamp?: string;
  accuracy?: number;
}

export class GeoController {
  // Add geolocation to batch
  async addBatchGeolocation(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { batchId } = req.params;
      const { latitude, longitude, address, accuracy } = req.body;

      if (!userId || !latitude || !longitude) {
        res.status(400).json({
          success: false,
          message: 'User ID, latitude, and longitude are required'
        });
        return;
      }

      // Validate coordinates
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        res.status(400).json({
          success: false,
          message: 'Invalid coordinates'
        });
        return;
      }

      // Check if batch exists and user has permission
      const { data: batch, error: batchError } = await supabaseAdmin
        .from('produce_batches')
        .select('id, current_owner_id, metadata')
        .eq('batch_id', batchId)
        .single();

      if (batchError || !batch) {
        res.status(404).json({
          success: false,
          message: 'Batch not found'
        });
        return;
      }

      if (batch.current_owner_id !== userId) {
        res.status(403).json({
          success: false,
          message: 'Not authorized to update this batch'
        });
        return;
      }

      // Update batch metadata with geolocation
      const geolocationData: GeolocationData = {
        latitude,
        longitude,
        address: address || null,
        timestamp: new Date().toISOString(),
        accuracy: accuracy || null
      };

      const updatedMetadata = {
        ...(batch.metadata || {}),
        geolocation: geolocationData,
        location_history: [
          ...(batch.metadata?.location_history || []),
          {
            ...geolocationData,
            updated_by: userId
          }
        ]
      };

      const { error: updateError } = await supabaseAdmin
        .from('produce_batches')
        .update({
          metadata: updatedMetadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', batch.id);

      if (updateError) {
        logger.error('Add geolocation error:', updateError);
        res.status(500).json({
          success: false,
          message: 'Failed to add geolocation'
        });
        return;
      }

      // Create audit log
      await supabaseAdmin
        .from('audit_logs')
        .insert([
          {
            batch_id: batch.id,
            user_id: userId,
            action: 'GEOLOCATION_UPDATED',
            new_values: geolocationData,
            timestamp: new Date().toISOString()
          }
        ]);

      res.status(200).json({
        success: true,
        message: 'Geolocation added successfully',
        data: {
          batch_id: batchId,
          geolocation: geolocationData
        }
      });

      logger.info(`Geolocation updated for batch ${batchId} by user ${userId}`);
    } catch (error) {
      logger.error('Add batch geolocation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add geolocation'
      });
    }
  }

  // Get batch location history
  async getBatchLocationHistory(req: Request, res: Response): Promise<void> {
    try {
      const { batchId } = req.params;

      const { data: batch, error } = await supabaseAdmin
        .from('produce_batches')
        .select('batch_id, product_name, metadata')
        .eq('batch_id', batchId)
        .single();

      if (error || !batch) {
        res.status(404).json({
          success: false,
          message: 'Batch not found'
        });
        return;
      }

      const locationHistory = batch.metadata?.location_history || [];
      const currentLocation = batch.metadata?.geolocation || null;

      res.status(200).json({
        success: true,
        data: {
          batch_id: batchId,
          product_name: batch.product_name,
          current_location: currentLocation,
          location_history: locationHistory,
          total_locations: locationHistory.length
        }
      });
    } catch (error) {
      logger.error('Get batch location history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve location history'
      });
    }
  }

  // Get batches by location (within radius)
  async getBatchesByLocation(req: Request, res: Response): Promise<void> {
    try {
      const { latitude, longitude, radius = 10 } = req.query; // radius in km

      if (!latitude || !longitude) {
        res.status(400).json({
          success: false,
          message: 'Latitude and longitude are required'
        });
        return;
      }

      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);
      const radiusKm = parseFloat(radius as string);

      // Get all batches with geolocation
      const { data: batches, error } = await supabaseAdmin
        .from('produce_batches')
        .select(`
          id,
          batch_id,
          product_name,
          origin_farm,
          status,
          current_owner_id,
          metadata,
          owner:users!current_owner_id(name, role)
        `)
        .not('metadata->geolocation', 'is', null);

      if (error) {
        logger.error('Get batches by location error:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to retrieve batches by location'
        });
        return;
      }

      // Filter batches within radius using Haversine formula
      const batchesInRadius = batches?.filter(batch => {
        const batchLat = batch.metadata?.geolocation?.latitude;
        const batchLng = batch.metadata?.geolocation?.longitude;

        if (!batchLat || !batchLng) return false;

        const distance = this.calculateDistance(lat, lng, batchLat, batchLng);
        return distance <= radiusKm;
      }).map(batch => ({
        ...batch,
        distance: this.calculateDistance(lat, lng, 
          batch.metadata.geolocation.latitude, 
          batch.metadata.geolocation.longitude
        ).toFixed(2)
      })) || [];

      // Sort by distance
      batchesInRadius.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

      res.status(200).json({
        success: true,
        data: {
          search_location: { latitude: lat, longitude: lng },
          radius_km: radiusKm,
          batches_found: batchesInRadius.length,
          batches: batchesInRadius
        }
      });
    } catch (error) {
      logger.error('Get batches by location error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve batches by location'
      });
    }
  }

  // Get user location analytics
  async getUserLocationAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      // Get user's batches with location data
      const { data: batches, error } = await supabaseAdmin
        .from('produce_batches')
        .select('batch_id, product_name, metadata, created_at')
        .eq('current_owner_id', userId)
        .not('metadata->geolocation', 'is', null);

      if (error) {
        logger.error('Get user location analytics error:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to retrieve location analytics'
        });
        return;
      }

      const locationAnalytics = {
        total_geotagged_batches: batches?.length || 0,
        locations: batches?.map(batch => ({
          batch_id: batch.batch_id,
          product_name: batch.product_name,
          location: batch.metadata.geolocation,
          created_at: batch.created_at
        })) || [],
        location_summary: this.generateLocationSummary(batches || [])
      };

      res.status(200).json({
        success: true,
        data: locationAnalytics
      });
    } catch (error) {
      logger.error('Get user location analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve location analytics'
      });
    }
  }

  // Helper method to calculate distance between two points using Haversine formula
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  }

  private toRad(value: number): number {
    return value * Math.PI / 180;
  }

  private generateLocationSummary(batches: any[]): any {
    const regionCounts: { [key: string]: number } = {};
    const coordinates: { lat: number; lng: number }[] = [];

    batches.forEach(batch => {
      if (batch.metadata?.geolocation) {
        const region = batch.metadata.geolocation.address || 'Unknown';
        regionCounts[region] = (regionCounts[region] || 0) + 1;
        coordinates.push({
          lat: batch.metadata.geolocation.latitude,
          lng: batch.metadata.geolocation.longitude
        });
      }
    });

    // Calculate center point
    let centerLat = 0, centerLng = 0;
    if (coordinates.length > 0) {
      centerLat = coordinates.reduce((sum, coord) => sum + coord.lat, 0) / coordinates.length;
      centerLng = coordinates.reduce((sum, coord) => sum + coord.lng, 0) / coordinates.length;
    }

    return {
      regions: regionCounts,
      center_point: coordinates.length > 0 ? { latitude: centerLat, longitude: centerLng } : null,
      total_coordinates: coordinates.length
    };
  }
}

export const geoController = new GeoController();
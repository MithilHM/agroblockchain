import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { logger } from '../utils/logger';
import { NotificationController } from './notificationController';

export class DistributorController {
  // Get available distributors for farmers to select from
  async getAvailableDistributors(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;
      const { location, product_type } = req.query;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      // Get distributors with their statistics
      const { data: distributors, error } = await supabaseAdmin
        .from('users')
        .select(`
          id,
          name,
          email,
          wallet_address,
          created_at,
          status
        `)
        .eq('role', 'distributor')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Get distributors error:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to retrieve distributors'
        });
        return;
      }

      // Get distributor statistics
      const distributorStats = await Promise.all(
        distributors.map(async (distributor: any) => {
          const [batchesRes, transfersRes, ratingsRes] = await Promise.all([
            // Current batches owned
            supabaseAdmin
              .from('produce_batches')
              .select('id, product_name, quantity, price_per_unit')
              .eq('current_owner_id', distributor.id),
            // Recent successful transfers
            supabaseAdmin
              .from('batch_transfers')
              .select('id, price_transferred, transfer_date')
              .eq('to_user_id', distributor.id)
              .gte('transfer_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
            // Quality ratings (from metadata)
            supabaseAdmin
              .from('produce_batches')
              .select('metadata')
              .eq('current_owner_id', distributor.id)
              .not('metadata->quality_verification', 'is', null)
          ]);

          const currentBatches = batchesRes.data || [];
          const recentTransfers = transfersRes.data || [];
          const ratingsData = ratingsRes.data || [];
          
          // Calculate average rating
          const ratings = ratingsData
            .map(batch => batch.metadata?.quality_verification?.verified)
            .filter(rating => rating !== undefined);
          const averageRating = ratings.length > 0 
            ? ratings.filter(r => r === true).length / ratings.length * 5 
            : 0;

          return {
            ...distributor,
            statistics: {
              current_inventory_count: currentBatches.length,
              current_inventory_value: currentBatches.reduce((sum, batch) => 
                sum + (parseFloat(batch.price_per_unit || '0') * parseFloat(batch.quantity || '0')), 0),
              recent_transactions: recentTransfers.length,
              average_rating: averageRating,
              experience_months: Math.floor((Date.now() - new Date(distributor.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30))
            },
            specialties: this.extractDistributorSpecialties(currentBatches)
          };
        })
      );

      // Filter by product type if specified
      let filteredDistributors = distributorStats;
      if (product_type) {
        filteredDistributors = distributorStats.filter(dist => 
          dist.specialties.includes(product_type.toString().toLowerCase())
        );
      }

      // Sort by rating and experience
      filteredDistributors.sort((a, b) => 
        (b.statistics.average_rating - a.statistics.average_rating) ||
        (b.statistics.experience_months - a.statistics.experience_months)
      );

      res.status(200).json({
        success: true,
        data: {
          distributors: filteredDistributors,
          total_count: filteredDistributors.length,
          filters_applied: {
            location: location || null,
            product_type: product_type || null
          }
        }
      });
    } catch (error) {
      logger.error('Get available distributors error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve distributors'
      });
    }
  }

  // Create batch offer to multiple distributors
  async createBatchOffer(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;
      const { batch_id, distributor_ids, offer_price, expiry_hours = 24, notes } = req.body;

      if (!userId || userRole !== 'farmer') {
        res.status(403).json({
          success: false,
          message: 'Only farmers can create batch offers'
        });
        return;
      }

      if (!batch_id || !distributor_ids || !Array.isArray(distributor_ids) || distributor_ids.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Batch ID and distributor IDs are required'
        });
        return;
      }

      // Check if batch exists and belongs to farmer
      const { data: batch, error: batchError } = await supabaseAdmin
        .from('produce_batches')
        .select('*')
        .eq('batch_id', batch_id)
        .eq('current_owner_id', userId)
        .single();

      if (batchError || !batch) {
        res.status(404).json({
          success: false,
          message: 'Batch not found or not owned by user'
        });
        return;
      }

      // Create offers for each distributor
      const offerPromises = distributor_ids.map(async (distributorId: string) => {
        const offerId = `OFFER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        return supabaseAdmin
          .from('batch_offers')
          .insert([
            {
              offer_id: offerId,
              batch_id: batch.id,
              farmer_id: userId,
              distributor_id: distributorId,
              offer_price: offer_price || batch.price_per_unit,
              status: 'pending',
              expiry_time: new Date(Date.now() + expiry_hours * 60 * 60 * 1000).toISOString(),
              notes: notes || null,
              created_at: new Date().toISOString()
            }
          ]);
      });

      await Promise.all(offerPromises);

      // Send notifications to all distributors
      const notificationPromises = distributor_ids.map(async (distributorId: string) => {
        return NotificationController.createNotification({
          user_id: distributorId,
          title: 'New Batch Offer',
          message: `You have received an offer for ${batch.product_name} from ${batch.origin_farm}`,
          type: 'info',
          batch_id: batch.batch_id,
          read: false
        });
      });

      await Promise.all(notificationPromises);

      // Create audit log
      await supabaseAdmin
        .from('audit_logs')
        .insert([
          {
            batch_id: batch.id,
            user_id: userId,
            action: 'BATCH_OFFER_CREATED',
            new_values: {
              distributor_count: distributor_ids.length,
              offer_price,
              expiry_hours
            },
            timestamp: new Date().toISOString()
          }
        ]);

      res.status(201).json({
        success: true,
        message: `Offers sent to ${distributor_ids.length} distributors`,
        data: {
          batch_id: batch_id,
          offers_sent: distributor_ids.length,
          offer_price: offer_price || batch.price_per_unit,
          expiry_hours
        }
      });

      logger.info(`Farmer ${userId} created batch offers for batch ${batch_id} to ${distributor_ids.length} distributors`);
    } catch (error) {
      logger.error('Create batch offer error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create batch offers'
      });
    }
  }

  // Get batch offers for distributor
  async getDistributorOffers(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;
      const { status = 'all' } = req.query;

      if (!userId || userRole !== 'distributor') {
        res.status(403).json({
          success: false,
          message: 'Only distributors can view offers'
        });
        return;
      }

      let query = supabaseAdmin
        .from('batch_offers')
        .select(`
          *,
          batch:produce_batches!batch_id(batch_id, product_name, origin_farm, quantity, unit, harvest_date, metadata),
          farmer:users!farmer_id(name, email)
        `)
        .eq('distributor_id', userId)
        .order('created_at', { ascending: false });

      if (status !== 'all') {
        query = query.eq('status', status);
      }

      const { data: offers, error } = await query;

      if (error) {
        logger.error('Get distributor offers error:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to retrieve offers'
        });
        return;
      }

      // Process offers to add time remaining
      const processedOffers = offers?.map(offer => ({
        ...offer,
        time_remaining_hours: Math.max(0, 
          Math.floor((new Date(offer.expiry_time).getTime() - Date.now()) / (1000 * 60 * 60))
        ),
        is_expired: new Date(offer.expiry_time) < new Date()
      })) || [];

      const offerStats = {
        total: processedOffers.length,
        pending: processedOffers.filter(o => o.status === 'pending' && !o.is_expired).length,
        accepted: processedOffers.filter(o => o.status === 'accepted').length,
        rejected: processedOffers.filter(o => o.status === 'rejected').length,
        expired: processedOffers.filter(o => o.is_expired).length
      };

      res.status(200).json({
        success: true,
        data: {
          offers: processedOffers,
          statistics: offerStats
        }
      });
    } catch (error) {
      logger.error('Get distributor offers error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve offers'
      });
    }
  }

  // Respond to batch offer (accept/reject)
  async respondToOffer(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;
      const { offerId } = req.params;
      const { action, counter_price, response_notes } = req.body;

      if (!userId || userRole !== 'distributor') {
        res.status(403).json({
          success: false,
          message: 'Only distributors can respond to offers'
        });
        return;
      }

      if (!['accept', 'reject', 'counter'].includes(action)) {
        res.status(400).json({
          success: false,
          message: 'Action must be accept, reject, or counter'
        });
        return;
      }

      // Get offer details
      const { data: offer, error: offerError } = await supabaseAdmin
        .from('batch_offers')
        .select(`
          *,
          batch:produce_batches!batch_id(*)
        `)
        .eq('offer_id', offerId)
        .eq('distributor_id', userId)
        .single();

      if (offerError || !offer) {
        res.status(404).json({
          success: false,
          message: 'Offer not found'
        });
        return;
      }

      // Check if offer is still valid
      if (new Date(offer.expiry_time) < new Date()) {
        res.status(400).json({
          success: false,
          message: 'Offer has expired'
        });
        return;
      }

      if (offer.status !== 'pending') {
        res.status(400).json({
          success: false,
          message: 'Offer already responded to'
        });
        return;
      }

      let updateData: any = {
        status: action === 'counter' ? 'pending' : action + 'ed',
        response_notes,
        responded_at: new Date().toISOString()
      };

      if (action === 'counter') {
        updateData.counter_price = counter_price;
        updateData.status = 'countered';
      }

      // Update offer
      const { error: updateError } = await supabaseAdmin
        .from('batch_offers')
        .update(updateData)
        .eq('id', offer.id);

      if (updateError) {
        logger.error('Respond to offer error:', updateError);
        res.status(500).json({
          success: false,
          message: 'Failed to respond to offer'
        });
        return;
      }

      // If accepted, cancel other pending offers for the same batch
      if (action === 'accept') {
        await supabaseAdmin
          .from('batch_offers')
          .update({ 
            status: 'cancelled',
            response_notes: 'Batch accepted by another distributor'
          })
          .eq('batch_id', offer.batch_id)
          .neq('id', offer.id)
          .eq('status', 'pending');
      }

      // Send notification to farmer
      const notificationMessage = action === 'accept' 
        ? `Your batch offer for ${offer.batch.product_name} has been accepted`
        : action === 'reject'
        ? `Your batch offer for ${offer.batch.product_name} has been rejected`
        : `You received a counter-offer for ${offer.batch.product_name}`;

      await NotificationController.createNotification({
        user_id: offer.farmer_id,
        title: `Batch Offer ${action.charAt(0).toUpperCase() + action.slice(1)}ed`,
        message: notificationMessage,
        type: action === 'accept' ? 'success' : action === 'reject' ? 'warning' : 'info',
        batch_id: offer.batch.batch_id,
        read: false
      });

      res.status(200).json({
        success: true,
        message: `Offer ${action}ed successfully`,
        data: {
          offer_id: offerId,
          action,
          final_price: action === 'counter' ? counter_price : offer.offer_price,
          batch_info: {
            batch_id: offer.batch.batch_id,
            product_name: offer.batch.product_name
          }
        }
      });

      logger.info(`Distributor ${userId} ${action}ed offer ${offerId}`);
    } catch (error) {
      logger.error('Respond to offer error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to respond to offer'
      });
    }
  }

  // Get distributor inventory analytics
  async getInventoryAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;

      if (!userId || userRole !== 'distributor') {
        res.status(403).json({
          success: false,
          message: 'Only distributors can view inventory analytics'
        });
        return;
      }

      // Get current inventory
      const { data: inventory, error: inventoryError } = await supabaseAdmin
        .from('produce_batches')
        .select('*')
        .eq('current_owner_id', userId)
        .in('status', ['harvested', 'in_transit', 'delivered']);

      if (inventoryError) {
        logger.error('Get inventory analytics error:', inventoryError);
        res.status(500).json({
          success: false,
          message: 'Failed to retrieve inventory analytics'
        });
        return;
      }

      // Get transfer statistics
      const [incomingRes, outgoingRes] = await Promise.all([
        supabaseAdmin
          .from('batch_transfers')
          .select('price_transferred, transfer_date')
          .eq('to_user_id', userId)
          .gte('transfer_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        supabaseAdmin
          .from('batch_transfers')
          .select('price_transferred, transfer_date')
          .eq('from_user_id', userId)
          .gte('transfer_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      ]);

      const analytics = this.calculateInventoryAnalytics(
        inventory || [],
        incomingRes.data || [],
        outgoingRes.data || []
      );

      res.status(200).json({
        success: true,
        data: analytics
      });
    } catch (error) {
      logger.error('Get inventory analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve inventory analytics'
      });
    }
  }

  private extractDistributorSpecialties(batches: any[]): string[] {
    const productTypes = new Set(
      batches.map(batch => batch.product_name?.toLowerCase()).filter(Boolean)
    );
    return Array.from(productTypes);
  }

  private calculateInventoryAnalytics(inventory: any[], incoming: any[], outgoing: any[]): any {
    const totalValue = inventory.reduce((sum, batch) => 
      sum + (parseFloat(batch.price_per_unit || '0') * parseFloat(batch.quantity || '0')), 0);

    const productBreakdown = inventory.reduce((acc: any, batch) => {
      const product = batch.product_name || 'Unknown';
      if (!acc[product]) {
        acc[product] = { count: 0, value: 0, quantity: 0 };
      }
      acc[product].count += 1;
      acc[product].value += parseFloat(batch.price_per_unit || '0') * parseFloat(batch.quantity || '0');
      acc[product].quantity += parseFloat(batch.quantity || '0');
      return acc;
    }, {});

    const statusBreakdown = inventory.reduce((acc: any, batch) => {
      acc[batch.status] = (acc[batch.status] || 0) + 1;
      return acc;
    }, {});

    const incomingValue = incoming.reduce((sum, t) => sum + parseFloat(t.price_transferred || '0'), 0);
    const outgoingValue = outgoing.reduce((sum, t) => sum + parseFloat(t.price_transferred || '0'), 0);

    return {
      inventory_summary: {
        total_batches: inventory.length,
        total_value: totalValue,
        average_batch_value: inventory.length > 0 ? totalValue / inventory.length : 0
      },
      product_breakdown: Object.entries(productBreakdown).map(([name, data]: [string, any]) => ({
        product_name: name,
        ...data
      })),
      status_breakdown: statusBreakdown,
      monthly_activity: {
        incoming_transfers: incoming.length,
        outgoing_transfers: outgoing.length,
        incoming_value: incomingValue,
        outgoing_value: outgoingValue,
        net_value: incomingValue - outgoingValue
      }
    };
  }
}

export const distributorController = new DistributorController();
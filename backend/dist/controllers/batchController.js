"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchController = exports.BatchController = void 0;
const uuid_1 = require("uuid");
const qrcode_1 = __importDefault(require("qrcode"));
const supabase_1 = require("../config/supabase");
const logger_1 = require("../utils/logger");
const notificationController_1 = require("./notificationController");
class BatchController {
    // Farmer registers a new produce batch
    async registerBatch(req, res) {
        try {
            const userId = req.user?.userId;
            const userRole = req.user?.role;
            if (!userId || userRole !== 'farmer') {
                res.status(403).json({
                    success: false,
                    message: 'Only farmers can register batches'
                });
                return;
            }
            const { product_name, origin_farm, harvest_date, quantity, unit, quality_grade, price_per_unit } = req.body;
            // Validate required fields
            if (!product_name || !origin_farm || !harvest_date || !quantity || !unit || !price_per_unit) {
                res.status(400).json({
                    success: false,
                    message: 'All required fields must be provided'
                });
                return;
            }
            const batchId = `AGRI-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
            const batchUuid = (0, uuid_1.v4)();
            // Simulate blockchain hash
            const blockchainHash = `0x${Math.random().toString(16).substr(2, 64)}`;
            // Generate QR code
            const qrData = {
                batchId,
                product_name,
                origin_farm,
                harvest_date,
                farmer_id: userId
            };
            const qrCodeUrl = await qrcode_1.default.toDataURL(JSON.stringify(qrData));
            // Insert batch into database
            const { data: newBatch, error } = await supabase_1.supabaseAdmin
                .from('produce_batches')
                .insert([
                {
                    id: batchUuid,
                    batch_id: batchId,
                    product_name,
                    origin_farm,
                    harvest_date,
                    quantity: parseFloat(quantity),
                    unit,
                    quality_grade,
                    price_per_unit: parseFloat(price_per_unit),
                    current_owner_id: userId,
                    blockchain_hash: blockchainHash,
                    qr_code_url: qrCodeUrl,
                    status: 'harvested',
                    metadata: {
                        registration_timestamp: new Date().toISOString(),
                        geo_location: req.body.geo_location || null
                    }
                }
            ])
                .select()
                .single();
            if (error) {
                logger_1.logger.error('Batch registration error:', error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to register batch'
                });
                return;
            }
            // Create audit log
            await supabase_1.supabaseAdmin
                .from('audit_logs')
                .insert([
                {
                    batch_id: newBatch.id,
                    user_id: userId,
                    action: 'BATCH_REGISTERED',
                    new_values: { batch_id: batchId, status: 'harvested' },
                    timestamp: new Date().toISOString()
                }
            ]);
            res.status(201).json({
                success: true,
                message: 'Batch registered successfully',
                data: {
                    batch: newBatch
                }
            });
            logger_1.logger.info(`Batch registered: ${batchId} by user ${userId}`);
        }
        catch (error) {
            logger_1.logger.error('Batch registration error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to register batch'
            });
        }
    }
    // Get batch details (public endpoint for QR scanning)
    async getBatch(req, res) {
        try {
            const { batchId } = req.params;
            const { data: batch, error } = await supabase_1.supabaseAdmin
                .from('produce_batches')
                .select(`
          *,
          current_owner:users!current_owner_id(id, name, role, email)
        `)
                .eq('batch_id', batchId)
                .single();
            if (error || !batch) {
                res.status(404).json({
                    success: false,
                    message: 'Batch not found'
                });
                return;
            }
            // Get transfer history
            const { data: transfers } = await supabase_1.supabaseAdmin
                .from('batch_transfers')
                .select(`
          *,
          from_user:users!from_user_id(name, role),
          to_user:users!to_user_id(name, role)
        `)
                .eq('batch_id', batch.id)
                .order('transfer_date', { ascending: true });
            res.status(200).json({
                success: true,
                data: {
                    batch,
                    transfer_history: transfers || []
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Get batch error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve batch'
            });
        }
    }
    // Transfer batch ownership (farmer to distributor, distributor to retailer)
    async transferBatch(req, res) {
        try {
            const userId = req.user?.userId;
            const userRole = req.user?.role;
            const { batchId } = req.params;
            const { to_user_id, transfer_price, notes, otp } = req.body;
            if (!to_user_id || !transfer_price || !otp) {
                res.status(400).json({
                    success: false,
                    message: 'Recipient, transfer price, and OTP are required'
                });
                return;
            }
            // Verify OTP (simple simulation)
            if (otp !== '123456') {
                res.status(400).json({
                    success: false,
                    message: 'Invalid OTP'
                });
                return;
            }
            // Get batch details
            const { data: batch, error: batchError } = await supabase_1.supabaseAdmin
                .from('produce_batches')
                .select('*')
                .eq('batch_id', batchId)
                .single();
            if (batchError || !batch) {
                res.status(404).json({
                    success: false,
                    message: 'Batch not found'
                });
                return;
            }
            // Verify current owner
            if (batch.current_owner_id !== userId) {
                res.status(403).json({
                    success: false,
                    message: 'You are not the current owner of this batch'
                });
                return;
            }
            // Verify recipient exists and has appropriate role
            const { data: recipient, error: recipientError } = await supabase_1.supabaseAdmin
                .from('users')
                .select('id, role')
                .eq('id', to_user_id)
                .single();
            if (recipientError || !recipient) {
                res.status(404).json({
                    success: false,
                    message: 'Recipient not found'
                });
                return;
            }
            // Validate transfer logic (farmer -> distributor -> retailer)
            const validTransfers = {
                farmer: ['distributor'],
                distributor: ['retailer', 'distributor'],
                retailer: []
            };
            if (!validTransfers[userRole]?.includes(recipient.role)) {
                res.status(400).json({
                    success: false,
                    message: `${userRole} cannot transfer to ${recipient.role}`
                });
                return;
            }
            // Update batch ownership
            const newStatus = recipient.role === 'retailer' ? 'delivered' : 'in_transit';
            const { error: updateError } = await supabase_1.supabaseAdmin
                .from('produce_batches')
                .update({
                current_owner_id: to_user_id,
                status: newStatus,
                updated_at: new Date().toISOString()
            })
                .eq('id', batch.id);
            if (updateError) {
                logger_1.logger.error('Batch update error:', updateError);
                res.status(500).json({
                    success: false,
                    message: 'Failed to transfer batch'
                });
                return;
            }
            // Record transfer
            await supabase_1.supabaseAdmin
                .from('batch_transfers')
                .insert([
                {
                    batch_id: batch.id,
                    from_user_id: userId,
                    to_user_id,
                    price_transferred: parseFloat(transfer_price),
                    blockchain_transaction_hash: `0x${Math.random().toString(16).substr(2, 64)}`,
                    notes
                }
            ]);
            // Create audit log
            await supabase_1.supabaseAdmin
                .from('audit_logs')
                .insert([
                {
                    batch_id: batch.id,
                    user_id: userId,
                    action: 'BATCH_TRANSFERRED',
                    old_values: { current_owner_id: userId, status: batch.status },
                    new_values: { current_owner_id: to_user_id, status: newStatus },
                    timestamp: new Date().toISOString()
                }
            ]);
            // Send notifications
            await notificationController_1.NotificationController.notifyBatchTransfer(userId, to_user_id, batchId, batch.product_name);
            res.status(200).json({
                success: true,
                message: 'Batch transferred successfully',
                data: {
                    batch_id: batchId,
                    new_owner_id: to_user_id,
                    status: newStatus
                }
            });
            logger_1.logger.info(`Batch ${batchId} transferred from ${userId} to ${to_user_id}`);
        }
        catch (error) {
            logger_1.logger.error('Transfer batch error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to transfer batch'
            });
        }
    }
    // Get user's batches (owned or previously owned)
    async getUserBatches(req, res) {
        try {
            const userId = req.user?.userId;
            const userRole = req.user?.role;
            // Get current batches owned by user
            const { data: currentBatches, error: currentError } = await supabase_1.supabaseAdmin
                .from('produce_batches')
                .select('*')
                .eq('current_owner_id', userId)
                .order('created_at', { ascending: false });
            if (currentError) {
                logger_1.logger.error('Get current batches error:', currentError);
            }
            // Get transfer history involving this user
            const { data: transferHistory, error: transferError } = await supabase_1.supabaseAdmin
                .from('batch_transfers')
                .select(`
          *,
          batch:produce_batches!batch_id(batch_id, product_name, status),
          from_user:users!from_user_id(name, role),
          to_user:users!to_user_id(name, role)
        `)
                .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
                .order('transfer_date', { ascending: false });
            if (transferError) {
                logger_1.logger.error('Get transfer history error:', transferError);
            }
            res.status(200).json({
                success: true,
                data: {
                    current_batches: currentBatches || [],
                    transfer_history: transferHistory || [],
                    user_role: userRole
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Get user batches error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve batches'
            });
        }
    }
    // Generate OTP for transactions
    async generateOTP(req, res) {
        try {
            const userId = req.user?.userId;
            const { action } = req.body; // 'sell' or 'buy'
            // Simple OTP generation (in production, use proper OTP service)
            const otp = '123456'; // Fixed for demo purposes
            res.status(200).json({
                success: true,
                message: 'OTP generated successfully',
                data: {
                    otp, // In production, don't return OTP in response
                    expires_in: 300, // 5 minutes
                    action
                }
            });
            logger_1.logger.info(`OTP generated for user ${userId} for action: ${action}`);
        }
        catch (error) {
            logger_1.logger.error('Generate OTP error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate OTP'
            });
        }
    }
    // Get available distributors/retailers for farmers
    async getPotentialBuyers(req, res) {
        try {
            const userRole = req.user?.role;
            let targetRoles = [];
            if (userRole === 'farmer') {
                targetRoles = ['distributor'];
            }
            else if (userRole === 'distributor') {
                targetRoles = ['retailer', 'distributor'];
            }
            if (targetRoles.length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'No potential buyers available for your role'
                });
                return;
            }
            const { data: buyers, error } = await supabase_1.supabaseAdmin
                .from('users')
                .select('id, name, email, role, wallet_address')
                .in('role', targetRoles);
            if (error) {
                logger_1.logger.error('Get potential buyers error:', error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to retrieve buyers'
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: {
                    buyers: buyers || []
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Get potential buyers error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve buyers'
            });
        }
    }
}
exports.BatchController = BatchController;
exports.batchController = new BatchController();
//# sourceMappingURL=batchController.js.map
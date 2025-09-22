"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walletController = exports.WalletController = void 0;
const supabase_1 = require("../config/supabase");
const logger_1 = require("../utils/logger");
class WalletController {
    // Get user wallet details
    async getWalletDetails(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
                return;
            }
            // Get user wallet information
            const { data: user, error: userError } = await supabase_1.supabaseAdmin
                .from('users')
                .select('id, name, email, role, wallet_address, status')
                .eq('id', userId)
                .single();
            if (userError || !user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }
            // Get transaction statistics
            const [batchesRes, transfersFromRes, transfersToRes] = await Promise.all([
                supabase_1.supabaseAdmin
                    .from('produce_batches')
                    .select('id, batch_id, product_name, price_per_unit, quantity, created_at')
                    .eq('current_owner_id', userId)
                    .order('created_at', { ascending: false }),
                supabase_1.supabaseAdmin
                    .from('batch_transfers')
                    .select('id, price_transferred, transfer_date, batch_id')
                    .eq('from_user_id', userId)
                    .order('transfer_date', { ascending: false }),
                supabase_1.supabaseAdmin
                    .from('batch_transfers')
                    .select('id, price_transferred, transfer_date, batch_id')
                    .eq('to_user_id', userId)
                    .order('transfer_date', { ascending: false })
            ]);
            // Calculate wallet statistics
            const currentBatches = batchesRes.data || [];
            const outgoingTransfers = transfersFromRes.data || [];
            const incomingTransfers = transfersToRes.data || [];
            const totalOutgoing = outgoingTransfers.reduce((sum, t) => sum + parseFloat(t.price_transferred || '0'), 0);
            const totalIncoming = incomingTransfers.reduce((sum, t) => sum + parseFloat(t.price_transferred || '0'), 0);
            const currentInventoryValue = currentBatches.reduce((sum, b) => sum + (parseFloat(b.price_per_unit || '0') * parseFloat(b.quantity || '0')), 0);
            res.status(200).json({
                success: true,
                data: {
                    wallet: {
                        address: user.wallet_address,
                        user_id: user.id,
                        user_name: user.name,
                        user_role: user.role
                    },
                    statistics: {
                        current_batches_count: currentBatches.length,
                        current_inventory_value: currentInventoryValue,
                        total_outgoing_value: totalOutgoing,
                        total_incoming_value: totalIncoming,
                        net_balance: totalIncoming - totalOutgoing + currentInventoryValue,
                        total_transactions: outgoingTransfers.length + incomingTransfers.length
                    },
                    recent_batches: currentBatches.slice(0, 5),
                    recent_transactions: {
                        outgoing: outgoingTransfers.slice(0, 5),
                        incoming: incomingTransfers.slice(0, 5)
                    }
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Get wallet details error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve wallet details'
            });
        }
    }
    // Get transaction history
    async getTransactionHistory(req, res) {
        try {
            const userId = req.user?.userId;
            const { page = 1, limit = 20, type = 'all' } = req.query;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
                return;
            }
            const offset = (Number(page) - 1) * Number(limit);
            let transfersQuery = supabase_1.supabaseAdmin
                .from('batch_transfers')
                .select(`
          *,
          batch:produce_batches!batch_id(batch_id, product_name),
          from_user:users!from_user_id(name, role),
          to_user:users!to_user_id(name, role)
        `)
                .order('transfer_date', { ascending: false })
                .range(offset, offset + Number(limit) - 1);
            // Filter by transaction type
            if (type === 'outgoing') {
                transfersQuery = transfersQuery.eq('from_user_id', userId);
            }
            else if (type === 'incoming') {
                transfersQuery = transfersQuery.eq('to_user_id', userId);
            }
            else {
                transfersQuery = transfersQuery.or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`);
            }
            const { data: transactions, error } = await transfersQuery;
            if (error) {
                logger_1.logger.error('Get transaction history error:', error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to retrieve transaction history'
                });
                return;
            }
            // Process transactions to add direction info
            const processedTransactions = transactions?.map(transaction => ({
                ...transaction,
                direction: transaction.from_user_id === userId ? 'outgoing' : 'incoming',
                counterpart: transaction.from_user_id === userId
                    ? transaction.to_user
                    : transaction.from_user
            })) || [];
            res.status(200).json({
                success: true,
                data: {
                    transactions: processedTransactions,
                    page: Number(page),
                    limit: Number(limit),
                    total_count: transactions?.length || 0
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Get transaction history error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve transaction history'
            });
        }
    }
    // Update wallet address
    async updateWalletAddress(req, res) {
        try {
            const userId = req.user?.userId;
            const { wallet_address } = req.body;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
                return;
            }
            if (!wallet_address || !/^0x[a-fA-F0-9]{40}$/.test(wallet_address)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid wallet address format'
                });
                return;
            }
            const { data: updatedUser, error } = await supabase_1.supabaseAdmin
                .from('users')
                .update({
                wallet_address,
                updated_at: new Date().toISOString()
            })
                .eq('id', userId)
                .select('id, name, wallet_address')
                .single();
            if (error) {
                logger_1.logger.error('Update wallet address error:', error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to update wallet address'
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Wallet address updated successfully',
                data: { user: updatedUser }
            });
            logger_1.logger.info(`User ${userId} updated wallet address to ${wallet_address}`);
        }
        catch (error) {
            logger_1.logger.error('Update wallet address error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update wallet address'
            });
        }
    }
    // Get earnings summary (for farmers and distributors)
    async getEarningsSummary(req, res) {
        try {
            const userId = req.user?.userId;
            const { period = '30' } = req.query; // days
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
                return;
            }
            const periodStart = new Date();
            periodStart.setDate(periodStart.getDate() - Number(period));
            // Get sales data (outgoing transfers)
            const { data: sales, error: salesError } = await supabase_1.supabaseAdmin
                .from('batch_transfers')
                .select(`
          price_transferred,
          transfer_date,
          batch:produce_batches!batch_id(product_name, quantity, unit)
        `)
                .eq('from_user_id', userId)
                .gte('transfer_date', periodStart.toISOString());
            if (salesError) {
                logger_1.logger.error('Get earnings summary error:', salesError);
                res.status(500).json({
                    success: false,
                    message: 'Failed to retrieve earnings summary'
                });
                return;
            }
            // Calculate earnings summary
            const totalEarnings = sales?.reduce((sum, sale) => sum + parseFloat(sale.price_transferred || '0'), 0) || 0;
            const salesByProduct = sales?.reduce((acc, sale) => {
                const productName = sale.batch?.product_name || 'Unknown';
                if (!acc[productName]) {
                    acc[productName] = {
                        product_name: productName,
                        total_sales: 0,
                        total_quantity: 0,
                        transaction_count: 0
                    };
                }
                acc[productName].total_sales += parseFloat(sale.price_transferred || '0');
                acc[productName].total_quantity += parseFloat(sale.batch?.quantity || '0');
                acc[productName].transaction_count += 1;
                return acc;
            }, {}) || {};
            // Generate daily earnings for chart
            const dailyEarnings = [];
            for (let i = Number(period) - 1; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dayStart = date.toISOString().split('T')[0];
                const dayEnd = new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                const dayEarnings = sales?.filter(sale => {
                    const saleDate = sale.transfer_date.split('T')[0];
                    return saleDate >= dayStart && saleDate < dayEnd;
                }).reduce((sum, sale) => sum + parseFloat(sale.price_transferred || '0'), 0) || 0;
                dailyEarnings.push({
                    date: dayStart,
                    earnings: dayEarnings
                });
            }
            res.status(200).json({
                success: true,
                data: {
                    period_days: Number(period),
                    total_earnings: totalEarnings,
                    total_transactions: sales?.length || 0,
                    average_per_transaction: sales?.length ? totalEarnings / sales.length : 0,
                    sales_by_product: Object.values(salesByProduct),
                    daily_earnings: dailyEarnings
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Get earnings summary error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve earnings summary'
            });
        }
    }
}
exports.WalletController = WalletController;
exports.walletController = new WalletController();
//# sourceMappingURL=walletController.js.map
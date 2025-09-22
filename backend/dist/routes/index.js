"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterRoutes = RegisterRoutes;
const batchRoutes_1 = __importDefault(require("./batchRoutes"));
const userRoutes_1 = __importDefault(require("./userRoutes"));
const adminRoutes_1 = __importDefault(require("./adminRoutes"));
const notificationRoutes_1 = __importDefault(require("./notificationRoutes"));
const walletRoutes_1 = require("./walletRoutes");
const geoRoutes_1 = require("./geoRoutes");
const distributorRoutes_1 = require("./distributorRoutes");
function RegisterRoutes(app) {
    app.use('/api/batch', batchRoutes_1.default);
    app.use('/api/user', userRoutes_1.default);
    app.use('/api/admin', adminRoutes_1.default);
    app.use('/api/notifications', notificationRoutes_1.default);
    app.use('/api/wallet', walletRoutes_1.walletRoutes);
    app.use('/api/geo', geoRoutes_1.geoRoutes);
    app.use('/api/distributor', distributorRoutes_1.distributorRoutes);
}
//# sourceMappingURL=index.js.map
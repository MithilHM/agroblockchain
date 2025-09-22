"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterRoutes = RegisterRoutes;
const batchRoutes_1 = __importDefault(require("./batchRoutes"));
const userRoutes_1 = __importDefault(require("./userRoutes"));
const fileRoutes_1 = __importDefault(require("./fileRoutes"));
const qrRoutes_1 = __importDefault(require("./qrRoutes"));
function RegisterRoutes(app) {
    app.use('/api/batch', batchRoutes_1.default);
    app.use('/api/user', userRoutes_1.default);
    app.use('/api/file', fileRoutes_1.default);
    app.use('/api/qr', qrRoutes_1.default);
}

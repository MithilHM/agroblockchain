"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterRoutes = RegisterRoutes;
const batchRoutes_1 = __importDefault(require("./batchRoutes"));
const userRoutes_1 = __importDefault(require("./userRoutes"));
function RegisterRoutes(app) {
    app.use('/api/batch', batchRoutes_1.default);
    app.use('/api/user', userRoutes_1.default);
}
//# sourceMappingURL=index.js.map
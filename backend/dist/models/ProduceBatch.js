"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProduceBatch = exports.BatchStatus = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
const Auditlog_1 = require("./Auditlog");
var BatchStatus;
(function (BatchStatus) {
    BatchStatus["HARVESTED"] = "harvested";
    BatchStatus["IN_TRANSIT"] = "in_transit";
    BatchStatus["WITH_DISTRIBUTOR"] = "with_distributor";
    BatchStatus["WITH_RETAILER"] = "with_retailer";
    BatchStatus["SOLD"] = "sold";
    BatchStatus["EXPIRED"] = "expired";
})(BatchStatus || (exports.BatchStatus = BatchStatus = {}));
let ProduceBatch = class ProduceBatch {
};
exports.ProduceBatch = ProduceBatch;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ProduceBatch.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], ProduceBatch.prototype, "batchId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ProduceBatch.prototype, "produceType", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ProduceBatch.prototype, "origin", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: BatchStatus, default: BatchStatus.HARVESTED }),
    __metadata("design:type", String)
], ProduceBatch.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 18, scale: 2 }),
    __metadata("design:type", Number)
], ProduceBatch.prototype, "currentPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], ProduceBatch.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ProduceBatch.prototype, "unit", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ProduceBatch.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], ProduceBatch.prototype, "certifications", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ProduceBatch.prototype, "qrCodeUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Array)
], ProduceBatch.prototype, "images", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], ProduceBatch.prototype, "geolocation", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], ProduceBatch.prototype, "harvestDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], ProduceBatch.prototype, "expiryDate", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, user => user.batches),
    (0, typeorm_1.JoinColumn)({ name: 'currentOwnerId' }),
    __metadata("design:type", User_1.User)
], ProduceBatch.prototype, "currentOwner", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ProduceBatch.prototype, "currentOwnerId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ProduceBatch.prototype, "originalFarmerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', array: true, default: [] }),
    __metadata("design:type", Array)
], ProduceBatch.prototype, "transferHistory", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Auditlog_1.AuditLog, log => log.batch),
    __metadata("design:type", Array)
], ProduceBatch.prototype, "auditLogs", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ProduceBatch.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ProduceBatch.prototype, "updatedAt", void 0);
exports.ProduceBatch = ProduceBatch = __decorate([
    (0, typeorm_1.Entity)('produce_batches')
], ProduceBatch);

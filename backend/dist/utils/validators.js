"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBatchId = exports.validateBatchTransfer = exports.validateBatchRegistration = exports.validateUserLogin = exports.validateUserRegistration = exports.handleValidationErrors = void 0;
const express_validator_1 = require("express-validator");
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            message: 'Validation errors',
            errors: errors.array()
        });
        return;
    }
    next();
};
exports.handleValidationErrors = handleValidationErrors;
// User validation rules
exports.validateUserRegistration = [
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    (0, express_validator_1.body)('name').notEmpty().withMessage('Name is required'),
    (0, express_validator_1.body)('role').isIn(['farmer', 'distributor', 'retailer', 'regulator', 'admin']).withMessage('Valid role is required'),
    (0, express_validator_1.body)('phone').optional().isMobilePhone('any').withMessage('Valid phone number required'),
    (0, express_validator_1.body)('address').optional().isLength({ min: 5 }).withMessage('Address must be at least 5 characters'),
    exports.handleValidationErrors
];
exports.validateUserLogin = [
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required'),
    exports.handleValidationErrors
];
// Batch validation rules
exports.validateBatchRegistration = [
    (0, express_validator_1.body)('produceType').notEmpty().withMessage('Produce type is required'),
    (0, express_validator_1.body)('origin').notEmpty().withMessage('Origin is required'),
    (0, express_validator_1.body)('currentPrice').isFloat({ min: 0 }).withMessage('Valid price is required'),
    (0, express_validator_1.body)('quantity').isFloat({ min: 0 }).withMessage('Valid quantity is required'),
    (0, express_validator_1.body)('unit').notEmpty().withMessage('Unit is required'),
    (0, express_validator_1.body)('harvestDate').optional().isISO8601().withMessage('Valid harvest date required'),
    (0, express_validator_1.body)('expiryDate').optional().isISO8601().withMessage('Valid expiry date required'),
    exports.handleValidationErrors
];
exports.validateBatchTransfer = [
    (0, express_validator_1.body)('newOwnerId').isUUID().withMessage('Valid new owner ID is required'),
    (0, express_validator_1.body)('price').optional().isFloat({ min: 0 }).withMessage('Valid price required'),
    exports.handleValidationErrors
];
exports.validateBatchId = [
    (0, express_validator_1.param)('batchId').isUUID().withMessage('Valid batch ID is required'),
    exports.handleValidationErrors
];

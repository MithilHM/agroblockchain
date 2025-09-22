import { body, param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
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

// User validation rules
export const validateUserRegistration = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').notEmpty().withMessage('Name is required'),
  body('role').isIn(['farmer', 'distributor', 'retailer', 'regulator', 'admin']).withMessage('Valid role is required'),
  body('phone').optional().isMobilePhone('any').withMessage('Valid phone number required'),
  body('address').optional().isLength({ min: 5 }).withMessage('Address must be at least 5 characters'),
  handleValidationErrors
];

export const validateUserLogin = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

// Batch validation rules
export const validateBatchRegistration = [
  body('produceType').notEmpty().withMessage('Produce type is required'),
  body('origin').notEmpty().withMessage('Origin is required'),
  body('currentPrice').isFloat({ min: 0 }).withMessage('Valid price is required'),
  body('quantity').isFloat({ min: 0 }).withMessage('Valid quantity is required'),
  body('unit').notEmpty().withMessage('Unit is required'),
  body('harvestDate').optional().isISO8601().withMessage('Valid harvest date required'),
  body('expiryDate').optional().isISO8601().withMessage('Valid expiry date required'),
  handleValidationErrors
];

export const validateBatchTransfer = [
  body('newOwnerId').isUUID().withMessage('Valid new owner ID is required'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Valid price required'),
  handleValidationErrors
];

export const validateBatchId = [
  param('batchId').isUUID().withMessage('Valid batch ID is required'),
  handleValidationErrors
];
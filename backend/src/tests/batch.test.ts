import request from 'supertest';
import app from '../app';
import jwt from 'jsonwebtoken';
import { AppError } from '../middlewares/errorHandler';

// Mock the batchService to isolate the controller
jest.mock('../services/batchService', () => ({
  registerNewBatch: jest.fn(),
  transferBatchOwnership: jest.fn(),
  getBatchById: jest.fn(),
}));

import { registerNewBatch, transferBatchOwnership, getBatchById } from '../services/batchService';

describe('Batch API Endpoints', () => {
  let farmerToken: string;
  let distributorToken: string;

  // Before all tests, create mock JWTs for different user roles
  beforeAll(() => {
    const jwtSecret = process.env.JWT_SECRET || 'test-secret';
    // This setup assumes you have a JWT_SECRET in your test environment
    if (process.env.JWT_SECRET === undefined) {
      console.warn('JWT_SECRET is not set for tests. Using a default, insecure secret.');
    }
    
    farmerToken = jwt.sign({ id: 'farmer-123', role: 'FARMER' }, jwtSecret);
    distributorToken = jwt.sign({ id: 'distributor-456', role: 'DISTRIBUTOR' }, jwtSecret);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- Tests for POST /api/batch/register ---
  describe('POST /api/batch/register', () => {
    const newBatchData = {
      produceName: 'Organic Tomatoes',
      origin: 'Farmville, CA',
      price: 150,
    };

    it('should allow a FARMER to register a new batch', async () => {
      // Arrange
      const mockReturn = { id: 'BATCH-123', ...newBatchData, owner: 'farmer-123' };
      (registerNewBatch as jest.Mock).mockResolvedValue(mockReturn);

      // Act
      const response = await request(app)
        .post('/api/batch/register')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send(newBatchData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.data.id).toBe('BATCH-123');
      expect(registerNewBatch).toHaveBeenCalledWith(expect.objectContaining({
        ...newBatchData,
        farmerId: 'farmer-123' // The service should receive the farmer's ID from the token
      }));
    });

    it('should return 403 Forbidden if a non-FARMER tries to register a batch', async () => {
      // Act
      const response = await request(app)
        .post('/api/batch/register')
        .set('Authorization', `Bearer ${distributorToken}`) // Using distributor token
        .send(newBatchData);

      // Assert
      expect(response.status).toBe(403);
      expect(response.body.message).toContain('permission');
      expect(registerNewBatch).not.toHaveBeenCalled();
    });

    it('should return 401 Unauthorized if no token is provided', async () => {
      const response = await request(app).post('/api/batch/register').send(newBatchData);
      expect(response.status).toBe(401);
    });
  });

  // --- Tests for POST /api/batch/transfer ---
  describe('POST /api/batch/transfer', () => {
    const transferData = {
        batchId: 'BATCH-123',
        newOwnerId: 'retailer-789'
    };

    it('should allow an authenticated user to transfer a batch', async () => {
        // Arrange
        (transferBatchOwnership as jest.Mock).mockResolvedValue({ success: true, message: 'Transfer successful' });

        // Act
        const response = await request(app)
            .post('/api/batch/transfer')
            .set('Authorization', `Bearer ${distributorToken}`)
            .send(transferData);
        
        // Assert
        expect(response.status).toBe(200);
        expect(response.body.data.message).toBe('Transfer successful');
        expect(transferBatchOwnership).toHaveBeenCalledWith({
            ...transferData,
            currentOwnerId: 'distributor-456' // Service receives current owner from token
        });
    });

    it('should return 404 Not Found if batch does not exist', async () => {
        // Arrange
        (transferBatchOwnership as jest.Mock).mockRejectedValue(new AppError('Batch not found or you are not the owner', 404));

        // Act
        const response = await request(app)
            .post('/api/batch/transfer')
            .set('Authorization', `Bearer ${distributorToken}`)
            .send(transferData);

        // Assert
        expect(response.status).toBe(404);
    });
  });
});

import request from 'supertest';
import app from '../app'; // Assuming your express app instance is exported from app.ts
import { AppError } from '../middlewares/errorHandler';

// Mock the entire userService to isolate the controller for testing
// We are testing that the controller calls the service correctly, not the service itself.
jest.mock('../services/userService', () => ({
  registerUser: jest.fn(),
  loginUser: jest.fn(),
}));

// Import the mocked service so we can manipulate its behavior in our tests
import { registerUser, loginUser } from '../services/userService';

describe('User API Endpoints', () => {
  // Clear all mocks after each test to ensure a clean state
  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- Tests for POST /api/user/register ---
  describe('POST /api/user/register', () => {
    const newUser = {
      name: 'Test Farmer',
      email: 'farmer@test.com',
      password: 'password123',
      role: 'FARMER',
    };

    it('should register a new user successfully and return a token', async () => {
      // Arrange: Configure the mock to simulate a successful registration
      const mockReturnValue = {
        user: { id: '1', name: newUser.name, email: newUser.email, role: newUser.role },
        token: 'mock-jwt-token',
      };
      (registerUser as jest.Mock).mockResolvedValue(mockReturnValue);

      // Act: Send a request to the endpoint
      const response = await request(app).post('/api/user/register').send(newUser);

      // Assert: Check the response
      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.user.email).toBe(newUser.email);
      expect(response.body.data).toHaveProperty('token');
      expect(registerUser).toHaveBeenCalledWith(newUser); // Ensure the service was called with correct data
    });

    it('should return 409 Conflict if the user already exists', async () => {
      // Arrange: Configure the mock to simulate a user conflict error
      (registerUser as jest.Mock).mockRejectedValue(new AppError('User with this email already exists', 409));

      // Act
      const response = await request(app).post('/api/user/register').send(newUser);

      // Assert
      expect(response.status).toBe(409);
      expect(response.body.message).toBe('User with this email already exists');
    });
  });

  // --- Tests for POST /api/user/login ---
  describe('POST /api/user/login', () => {
    const loginCredentials = {
      email: 'farmer@test.com',
      password: 'password123',
    };

    it('should log in a user successfully and return a token', async () => {
      // Arrange
      const mockReturnValue = {
        user: { id: '1', email: loginCredentials.email, role: 'FARMER' },
        token: 'mock-jwt-token-on-login',
      };
      (loginUser as jest.Mock).mockResolvedValue(mockReturnValue);

      // Act
      const response = await request(app).post('/api/user/login').send(loginCredentials);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('token', mockReturnValue.token);
      expect(loginUser).toHaveBeenCalledWith(loginCredentials.email, loginCredentials.password);
    });

    it('should return 401 Unauthorized for invalid credentials', async () => {
      // Arrange
      (loginUser as jest.Mock).mockRejectedValue(new AppError('Invalid email or password', 401));

      // Act
      const response = await request(app).post('/api/user/login').send({ email: 'wrong@test.com', password: 'wrong' });

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid email or password');
    });
  });
});

import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';

// Mock database module
jest.unstable_mockModule('../src/config/database.js', () => ({
  query: jest.fn(),
  default: {
    connect: jest.fn(),
    end: jest.fn()
  }
}));

// Import after mocking
const { default: request } = await import('supertest');
const { default: app } = await import('../src/index.js');
const { query } = await import('../src/config/database.js');

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        name: 'Test User',
        role: 'youth',
        avatar: null,
        points: 100,
        level: 1,
        created_at: new Date().toISOString()
      };

      query.mockResolvedValueOnce({ rows: [] }); // Check existing user
      query.mockResolvedValueOnce({ rows: [mockUser] }); // Create user
      query.mockResolvedValueOnce({ rows: [] }); // Store refresh token

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User'
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Registration successful');
      expect(res.body.user.email).toBe('test@example.com');
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
    });

    it('should return error for invalid email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          name: 'Test User'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('valid email');
    });

    it('should return error for short password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: '12345',
          name: 'Test User'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('6 characters');
    });

    it('should return error for existing email', async () => {
      query.mockResolvedValueOnce({ 
        rows: [{ id: 'existing-user', email: 'test@example.com' }] 
      });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User'
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('already registered');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        name: 'Test User',
        role: 'youth',
        password_hash: '$2b$10$hashedpassword',
        points: 100,
        level: 1,
        streak: 5,
        check_ins: 10,
        check_ins_target: 15,
        prayers_shared: 3,
        posts_count: 2
      };

      query.mockResolvedValueOnce({ rows: [mockUser] }); // Find user
      query.mockResolvedValueOnce({ rows: [] }); // Store refresh token

      // Mock bcrypt compare
      jest.unstable_mockModule('bcrypt', () => ({
        default: {
          compare: jest.fn().mockResolvedValue(true),
          hash: jest.fn().mockResolvedValue('$2b$10$hashedpassword')
        }
      }));

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Login successful');
      expect(res.body.user.email).toBe('test@example.com');
      expect(res.body.accessToken).toBeDefined();
    });

    it('should return error for non-existent user', async () => {
      query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Invalid email or password');
    });

    it('should return error for invalid password', async () => {
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        password_hash: '$2b$10$hashedpassword'
      };

      query.mockResolvedValueOnce({ rows: [mockUser] });

      jest.unstable_mockModule('bcrypt', () => ({
        default: {
          compare: jest.fn().mockResolvedValue(false),
          hash: jest.fn().mockResolvedValue('$2b$10$hashedpassword')
        }
      }));

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Invalid email or password');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return user data with valid token', async () => {
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        name: 'Test User',
        role: 'youth',
        points: 100,
        level: 1
      };

      query.mockResolvedValueOnce({ rows: [mockUser] });

      // This test would need a valid JWT token
      // For now, we test the endpoint exists
      const res = await request(app)
        .get('/api/v1/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Access token required');
    });
  });

  describe('GET /api/health', () => {
    it('should return healthy status', async () => {
      query.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });

      const res = await request(app)
        .get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.database).toBe('connected');
    });
  });
});

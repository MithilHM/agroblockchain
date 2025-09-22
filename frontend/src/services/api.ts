// API service for backend communication
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'farmer' | 'distributor' | 'retailer' | 'regulator' | 'admin';
  phone?: string;
  address?: string;
  walletAddress?: string;
  status: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: 'farmer' | 'distributor' | 'retailer';
  phone?: string;
  address?: string;
  walletAddress?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ProduceBatch {
  id: string;
  batchId: string;
  produceType: string;
  origin: string;
  status: string;
  currentPrice: number;
  quantity: number;
  unit: string;
  description?: string;
  currentOwnerId: string;
  originalFarmerId: string;
  createdAt: string;
  updatedAt: string;
}

class ApiService {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage if available
    this.token = localStorage.getItem('authToken');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Authentication endpoints
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>('/api/user/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>('/api/user/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async getProfile(): Promise<ApiResponse<{ user: User }>> {
    return this.request<{ user: User }>('/api/user/profile');
  }

  async updateProfile(userData: Partial<User>): Promise<ApiResponse<{ user: User }>> {
    return this.request<{ user: User }>('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async getDashboard(): Promise<ApiResponse<any>> {
    return this.request('/api/user/dashboard');
  }

  // Batch endpoints
  async getBatches(): Promise<ApiResponse<ProduceBatch[]>> {
    return this.request<ProduceBatch[]>('/api/batch');
  }

  async getBatch(id: string): Promise<ApiResponse<ProduceBatch>> {
    return this.request<ProduceBatch>(`/api/batch/${id}`);
  }

  async createBatch(batchData: any): Promise<ApiResponse<ProduceBatch>> {
    return this.request<ProduceBatch>('/api/batch', {
      method: 'POST',
      body: JSON.stringify(batchData),
    });
  }

  async updateBatch(id: string, batchData: any): Promise<ApiResponse<ProduceBatch>> {
    return this.request<ProduceBatch>(`/api/batch/${id}`, {
      method: 'PUT',
      body: JSON.stringify(batchData),
    });
  }

  async transferBatch(id: string, transferData: any): Promise<ApiResponse<any>> {
    return this.request(`/api/batch/${id}/transfer`, {
      method: 'POST',
      body: JSON.stringify(transferData),
    });
  }

  // QR Code endpoints
  async generateQRCode(batchId: string): Promise<ApiResponse<{ qrCodeUrl: string }>> {
    return this.request<{ qrCodeUrl: string }>(`/api/qr/${batchId}/generate`, {
      method: 'POST',
    });
  }

  async scanQRCode(qrCode: string): Promise<ApiResponse<ProduceBatch>> {
    return this.request<ProduceBatch>(`/api/qr/scan`, {
      method: 'POST',
      body: JSON.stringify({ qrCode }),
    });
  }

  // File upload endpoints
  async uploadFile(file: File, purpose: string): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('purpose', purpose);

    const headers: HeadersInit = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/file/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('File upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'File upload failed'
      };
    }
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<any>> {
    return this.request('/health');
  }

  logout() {
    this.clearToken();
  }
}

export const apiService = new ApiService();
export default apiService;
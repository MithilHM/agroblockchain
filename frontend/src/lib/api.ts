const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'farmer' | 'distributor' | 'retailer' | 'admin' | 'regulator';
  wallet_address?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    token: string;
  };
}

export interface Batch {
  id: string;
  batch_id: string;
  product_name: string;
  origin_farm: string;
  harvest_date: string;
  quantity: number;
  unit: string;
  quality_grade?: string;
  price_per_unit: number;
  current_owner_id: string;
  blockchain_hash?: string;
  qr_code_url?: string;
  status: 'harvested' | 'in_transit' | 'delivered' | 'sold';
  metadata?: any;
  created_at: string;
  updated_at: string;
  current_owner?: User;
}

export interface Transfer {
  id: string;
  batch_id: string;
  from_user_id: string;
  to_user_id: string;
  transfer_date: string;
  price_transferred: number;
  blockchain_transaction_hash?: string;
  notes?: string;
  batch?: Batch;
  from_user?: User;
  to_user?: User;
}

export interface DashboardStats {
  role: string;
  statistics: any;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = API_BASE_URL;
    this.token = localStorage.getItem('authToken');
    console.log('API Client initialized with base URL:', this.baseUrl);
  }

  setAuthToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    console.log('API Request:', {
      url,
      method: options.method || 'GET',
      hasBody: !!options.body
    });
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      console.log('API Response:', {
        status: response.status,
        ok: response.ok,
        url: response.url
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('API Request Failed:', {
        url,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Auth endpoints
  async register(email: string, password: string, name: string, role: string, wallet_address?: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/user/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, role, wallet_address }),
    });
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/user/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getProfile(): Promise<{ success: boolean; data: { user: User; statistics?: any } }> {
    return this.request<{ success: boolean; data: { user: User; statistics?: any } }>('/user/profile');
  }

  async updateProfile(name: string, wallet_address?: string): Promise<{ success: boolean; data: { user: User } }> {
    return this.request<{ success: boolean; data: { user: User } }>('/user/profile', {
      method: 'PUT',
      body: JSON.stringify({ name, wallet_address }),
    });
  }

  async getDashboardStats(): Promise<{ success: boolean; data: DashboardStats }> {
    return this.request<{ success: boolean; data: DashboardStats }>('/user/dashboard-stats');
  }

  // Batch endpoints
  async registerBatch(batchData: {
    product_name: string;
    origin_farm: string;
    harvest_date: string;
    quantity: number;
    unit: string;
    quality_grade?: string;
    price_per_unit: number;
    geo_location?: any;
  }): Promise<{ success: boolean; data: { batch: Batch } }> {
    return this.request<{ success: boolean; data: { batch: Batch } }>('/batch/register', {
      method: 'POST',
      body: JSON.stringify(batchData),
    });
  }

  async getBatch(batchId: string): Promise<{ success: boolean; data: { batch: Batch; transfer_history: Transfer[] } }> {
    return this.request<{ success: boolean; data: { batch: Batch; transfer_history: Transfer[] } }>(`/batch/${batchId}`);
  }

  async getUserBatches(): Promise<{ success: boolean; data: { current_batches: Batch[]; transfer_history: Transfer[]; user_role: string } }> {
    return this.request<{ success: boolean; data: { current_batches: Batch[]; transfer_history: Transfer[]; user_role: string } }>('/batch/my-batches');
  }

  async transferBatch(batchId: string, transferData: {
    to_user_id: string;
    transfer_price: number;
    notes?: string;
    otp: string;
  }): Promise<{ success: boolean; message: string; data: any }> {
    return this.request<{ success: boolean; message: string; data: any }>(`/batch/transfer/${batchId}`, {
      method: 'POST',
      body: JSON.stringify(transferData),
    });
  }

  async generateOTP(action: 'sell' | 'buy'): Promise<{ success: boolean; data: { otp: string; expires_in: number; action: string } }> {
    return this.request<{ success: boolean; data: { otp: string; expires_in: number; action: string } }>('/batch/generate-otp', {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  }

  async getPotentialBuyers(): Promise<{ success: boolean; data: { buyers: User[] } }> {
    return this.request<{ success: boolean; data: { buyers: User[] } }>('/batch/potential-buyers');
  }
}

export const apiClient = new ApiClient();
export default apiClient;
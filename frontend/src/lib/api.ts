const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'farmer' | 'distributor' | 'retailer';
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
  async register(email: string, password: string, name: string, role: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/user/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, role }),
    });
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/user/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getProfile(): Promise<{ success: boolean; data: { user: User } }> {
    return this.request<{ success: boolean; data: { user: User } }>('/user/profile');
  }

  async updateProfile(name: string, wallet_address?: string): Promise<{ success: boolean; data: { user: User } }> {
    return this.request<{ success: boolean; data: { user: User } }>('/user/profile', {
      method: 'PUT',
      body: JSON.stringify({ name, wallet_address }),
    });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
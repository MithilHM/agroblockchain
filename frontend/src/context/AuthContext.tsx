import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService, User, LoginRequest, RegisterRequest } from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginRequest) => Promise<{ success: boolean; error?: string }>;
  register: (userData: RegisterRequest) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const response = await apiService.getProfile();
          if (response.success && response.data?.user) {
            setUser(response.data.user);
          } else {
            // Invalid token, clear it
            localStorage.removeItem('authToken');
            apiService.clearToken();
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('authToken');
          apiService.clearToken();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginRequest): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiService.login(credentials);
      
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        return { success: true };
      } else {
        return { 
          success: false, 
          error: response.error || response.message || 'Login failed' 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      };
    }
  };

  const register = async (userData: RegisterRequest): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiService.register(userData);
      
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        return { success: true };
      } else {
        return { 
          success: false, 
          error: response.error || response.message || 'Registration failed' 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Registration failed' 
      };
    }
  };

  const logout = () => {
    setUser(null);
    apiService.logout();
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
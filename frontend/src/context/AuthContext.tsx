import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient, User } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export type UserRole = 'farmer' | 'distributor' | 'retailer';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string, role: UserRole, wallet_address?: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    if (token) {
      apiClient.setAuthToken(token);
      loadUserProfile();
    } else {
      setIsLoading(false);
    }
  }, []);

  const loadUserProfile = async () => {
    try {
      const response = await apiClient.getProfile();
      if (response.success) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      // Clear invalid token
      localStorage.removeItem('authToken');
      apiClient.setAuthToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await apiClient.login(email, password);
      
      if (response.success && response.data) {
        setUser(response.data.user);
        apiClient.setAuthToken(response.data.token);
        toast({
          title: "Login Successful",
          description: `Welcome back, ${response.data.user.name}!`,
        });
        return true;
      }
      
      return false;
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "An error occurred during login",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string, role: UserRole, wallet_address?: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await apiClient.register(email, password, name, role, wallet_address);
      
      if (response.success && response.data) {
        setUser(response.data.user);
        apiClient.setAuthToken(response.data.token);
        toast({
          title: "Registration Successful",
          description: `Welcome to AgriChain, ${response.data.user.name}!`,
        });
        return true;
      }
      
      return false;
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "An error occurred during registration",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    apiClient.setAuthToken(null);
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isLoading
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
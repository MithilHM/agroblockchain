import { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'farmer' | 'distributor' | 'retailer';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  farmLocation?: string;
  farmArea?: string;
  farmerId?: string;
  distributorId?: string;
  retailerId?: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: Omit<User, 'id'>) => void;
  register: (userData: Omit<User, 'id'> & { password: string; confirmPassword: string }) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (userData: Omit<User, 'id'>) => {
    // Generate role-specific ID
    let roleId = '';
    if (userData.role === 'farmer') {
      roleId = `F${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    } else if (userData.role === 'distributor') {
      roleId = `D${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    } else if (userData.role === 'retailer') {
      roleId = `R${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    }

    const newUser: User = {
      ...userData,
      id: Math.random().toString(36).substr(2, 9),
      farmerId: userData.role === 'farmer' ? roleId : undefined,
      distributorId: userData.role === 'distributor' ? roleId : undefined,
      retailerId: userData.role === 'retailer' ? roleId : undefined,
    };
    setUser(newUser);
  };

  const register = (userData: Omit<User, 'id'> & { password: string; confirmPassword: string }) => {
    // In a real app, you'd validate password strength, etc.
    const { password, confirmPassword, ...userDataWithoutPassword } = userData;
    
    if (password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }
    
    login(userDataWithoutPassword);
  };

  const logout = () => {
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    isAuthenticated: !!user
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
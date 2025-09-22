import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RoleCard } from '@/components/ui/role-card';
import { useAuth, UserRole } from '@/context/AuthContext';
import { Sprout, Truck, Store, ChevronRight } from 'lucide-react';

const roles = [
  {
    id: 'farmer' as UserRole,
    title: 'Farmer',
    description: 'Register and track your produce from harvest to market',
    icon: Sprout
  },
  {
    id: 'distributor' as UserRole,
    title: 'Distributor',
    description: 'Manage supply chain and track product distribution',
    icon: Truck
  },
  {
    id: 'retailer' as UserRole,
    title: 'Retailer',
    description: 'Verify product authenticity and manage inventory',
    icon: Store
  }
];

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    wallet_address: ''
  });
  const { login, register, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLogin) {
      if (!formData.email || !formData.password) return;
      await login(formData.email, formData.password);
    } else {
      if (!selectedRole || !formData.name || !formData.email || !formData.password) return;
      await register(formData.email, formData.password, formData.name, selectedRole);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: ''
    });
    setSelectedRole(null);
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-gradient-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-primary p-3 rounded-full shadow-medium">
              <Sprout className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            AgriChain Tracker
          </h1>
          <p className="text-lg text-muted-foreground">
            Transparent agricultural supply chain management
          </p>
        </div>

        <Card className="shadow-medium bg-card/95 backdrop-blur">
          <CardHeader className="text-center">
            <h2 className="text-2xl font-semibold">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <CardDescription>
              {isLogin 
                ? 'Sign in to your agricultural supply chain account'
                : 'Select your role in the agricultural supply chain to get started'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Role Selection - Only for registration */}
              {!isLogin && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {roles.map((role) => (
                    <RoleCard
                      key={role.id}
                      title={role.title}
                      description={role.description}
                      icon={role.icon}
                      selected={selectedRole === role.id}
                      onClick={() => setSelectedRole(role.id)}
                    />
                  ))}
                </div>
              )}

              {/* User Information Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {!isLogin && (
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="gradient"
                size="lg"
                className="w-full"
                disabled={
                  isLoading || 
                  (isLogin 
                    ? !formData.email || !formData.password
                    : !selectedRole || !formData.name || !formData.email || !formData.password
                  )
                }
              >
                {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Get Started')}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>

              {/* Toggle between login and register */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {isLogin 
                    ? "Don't have an account? Sign up"
                    : "Already have an account? Sign in"
                  }
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
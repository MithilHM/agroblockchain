import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RoleCard } from '@/components/ui/role-card';
import { useAuth, UserRole } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Sprout, Truck, Store, ChevronRight, Eye, EyeOff, MapPin, Ruler, User } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const roles = [
  {
    id: 'farmer' as UserRole,
    title: '🌾 Farmer',
    description: 'Register and track your produce from harvest to market 🚜',
    icon: Sprout,
    emoji: '👨‍🌾'
  },
  {
    id: 'distributor' as UserRole,
    title: '🚛 Distributor',
    description: 'Manage supply chain and track product distribution 📦',
    icon: Truck,
    emoji: '🚚'
  },
  {
    id: 'retailer' as UserRole,
    title: '🏪 Retailer',
    description: 'Verify product authenticity and manage inventory 🛒',
    icon: Store,
    emoji: '🛍️'
  }
];

export default function Login() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    farmLocation: '',
    farmArea: ''
  });
  
  const { login, register } = useAuth();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole || !loginData.email || !loginData.password) {
      toast({
        title: "Missing Information",
        description: "Please select a role and fill in all fields.",
        variant: "destructive",
      });
      return;
    }
    
    // Mock login - in real app, you'd validate credentials
    login({
      name: loginData.email.split('@')[0], // Use email prefix as name for demo
      email: loginData.email,
      role: selectedRole
    });
    
    toast({
      title: "Welcome back! 🎉",
      description: `Successfully logged in as ${selectedRole}.`,
    });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRole || !registerData.name || !registerData.email || !registerData.password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (selectedRole === 'farmer' && (!registerData.farmLocation || !registerData.farmArea)) {
      toast({
        title: "Farm Details Required",
        description: "Please provide farm location and area.",
        variant: "destructive",
      });
      return;
    }

    try {
      register({
        name: registerData.name,
        email: registerData.email,
        role: selectedRole,
        password: registerData.password,
        confirmPassword: registerData.confirmPassword,
        farmLocation: selectedRole === 'farmer' ? registerData.farmLocation : undefined,
        farmArea: selectedRole === 'farmer' ? registerData.farmArea : undefined,
      });
      
      toast({
        title: "Registration Successful! 🎊",
        description: `Welcome to AgriChain Tracker! Your ${selectedRole} account has been created.`,
      });
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetForms = () => {
    setLoginData({ email: '', password: '' });
    setRegisterData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      farmLocation: '',
      farmArea: ''
    });
    setSelectedRole(null);
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
            🌱 AgriChain Tracker
          </h1>
          <p className="text-lg text-muted-foreground">
            Transparent agricultural supply chain management 🚜➡️🏪
          </p>
        </div>

        <Card className="shadow-medium bg-card/95 backdrop-blur">
          <CardHeader className="text-center">
            <Tabs value={activeTab} onValueChange={(value) => {
              setActiveTab(value as 'login' | 'register');
              resetForms();
            }}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">🔐 Sign In</TabsTrigger>
                <TabsTrigger value="register">📝 Sign Up</TabsTrigger>
              </TabsList>
              
              <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-2">
                  {activeTab === 'login' ? 'Welcome Back! 👋' : 'Join AgriChain! 🌟'}
                </h2>
                <CardDescription>
                  {activeTab === 'login' 
                    ? 'Sign in to continue tracking your agricultural products'
                    : 'Create your account to start managing the supply chain'
                  }
                </CardDescription>
              </div>

              {/* Role Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Choose Your Role 🎭</h3>
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
              </div>

              <TabsContent value="login">
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">📧 Email Address</Label>
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="Enter your email"
                          value={loginData.email}
                          onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password">🔒 Password</Label>
                        <div className="relative">
                          <Input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={loginData.password}
                            onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      variant="gradient"
                      size="lg"
                      className="w-full"
                      disabled={!selectedRole || !loginData.email || !loginData.password}
                    >
                      🚀 Sign In
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                </CardContent>
              </TabsContent>

              <TabsContent value="register">
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-name">👤 Full Name</Label>
                        <Input
                          id="register-name"
                          type="text"
                          placeholder="Enter your full name"
                          value={registerData.name}
                          onChange={(e) => setRegisterData(prev => ({ ...prev, name: e.target.value }))}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="register-email">📧 Email Address</Label>
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="Enter your email"
                          value={registerData.email}
                          onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                          required
                        />
                      </div>

                      {selectedRole === 'farmer' && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="farm-location">📍 Farm Location</Label>
                            <div className="relative">
                              <Input
                                id="farm-location"
                                type="text"
                                placeholder="e.g., Punjab, India"
                                value={registerData.farmLocation}
                                onChange={(e) => setRegisterData(prev => ({ ...prev, farmLocation: e.target.value }))}
                                required
                              />
                              <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="farm-area">📏 Farm Area (in acres)</Label>
                            <div className="relative">
                              <Input
                                id="farm-area"
                                type="text"
                                placeholder="e.g., 5.5 acres"
                                value={registerData.farmArea}
                                onChange={(e) => setRegisterData(prev => ({ ...prev, farmArea: e.target.value }))}
                                required
                              />
                              <Ruler className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                        </>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="register-password">🔒 Password</Label>
                          <div className="relative">
                            <Input
                              id="register-password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Create password"
                              value={registerData.password}
                              onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                              required
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="confirm-password">🔐 Confirm Password</Label>
                          <div className="relative">
                            <Input
                              id="confirm-password"
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Confirm password"
                              value={registerData.confirmPassword}
                              onChange={(e) => setRegisterData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                              required
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      variant="gradient"
                      size="lg"
                      className="w-full"
                      disabled={!selectedRole || !registerData.name || !registerData.email || !registerData.password}
                    >
                      🎉 Create Account
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                </CardContent>
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
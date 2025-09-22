import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import { Shield, Users, Package, Activity, DollarSign, LogOut, Eye, Ban, CheckCircle, AlertTriangle } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  statistics: {
    total_batches: number;
    total_transactions: number;
    total_value: number;
  };
}

interface SystemStats {
  total_users: number;
  total_batches: number;
  total_transfers: number;
  total_value: number;
  batches_by_status: Record<string, number>;
  recent_activities: number;
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<User[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats>({
    total_users: 0,
    total_batches: 0,
    total_transfers: 0,
    total_value: 0,
    batches_by_status: {},
    recent_activities: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [verifyData, setVerifyData] = useState({
    batchId: '',
    quality_verified: true,
    quality_notes: '',
    inspector_certificate: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const [usersRes, statsRes] = await Promise.all([
        apiClient.get('/api/admin/users'),
        apiClient.get('/api/admin/stats')
      ]);
      
      if (usersRes.success) {
        setUsers(usersRes.data.users);
      }
      
      if (statsRes.success) {
        setSystemStats(statsRes.data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUserStatus = async (userId: string, newStatus: string) => {
    try {
      const response = await apiClient.put(`/api/admin/users/${userId}/status`, {
        status: newStatus
      });

      if (response.success) {
        toast({
          title: "Success",
          description: `User ${newStatus} successfully`
        });
        loadData();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${newStatus} user`,
        variant: "destructive"
      });
    }
  };

  const handleVerifyBatch = async () => {
    if (!verifyData.batchId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a batch ID",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await apiClient.post(`/api/admin/verify-batch/${verifyData.batchId}`, {
        quality_verified: verifyData.quality_verified,
        quality_notes: verifyData.quality_notes,
        inspector_certificate: verifyData.inspector_certificate
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Batch quality verified successfully"
        });
        
        setShowVerifyDialog(false);
        setVerifyData({
          batchId: '',
          quality_verified: true,
          quality_notes: '',
          inspector_certificate: ''
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify batch",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'farmer': return 'bg-green-500';
      case 'distributor': return 'bg-blue-500';
      case 'retailer': return 'bg-purple-500';
      case 'admin': return 'bg-red-500';
      case 'regulator': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'suspended': return 'bg-red-500';
      case 'inactive': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-6 w-6 text-red-600" />
                <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-2 bg-card rounded-lg border">
                <Shield className="h-4 w-4" />
                <span className="font-medium">{user?.name}</span>
              </div>
              
              <Button variant="outline" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* System Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{systemStats.total_users}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Batches</p>
                  <p className="text-2xl font-bold">{systemStats.total_batches}</p>
                </div>
                <Package className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">${systemStats.total_value.toFixed(2)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Recent Activities</p>
                  <p className="text-2xl font-bold">{systemStats.recent_activities}</p>
                </div>
                <Activity className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="flex space-x-4">
            <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
              <DialogTrigger asChild>
                <Button variant="gradient" className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Verify Batch Quality</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Verify Batch Quality</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="batchId">Batch ID</Label>
                    <Input
                      id="batchId"
                      placeholder="Enter batch ID"
                      value={verifyData.batchId}
                      onChange={(e) => setVerifyData(prev => ({ ...prev, batchId: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Quality Status</Label>
                    <div className="flex space-x-4">
                      <Button 
                        variant={verifyData.quality_verified ? "default" : "outline"}
                        size="sm"
                        onClick={() => setVerifyData(prev => ({ ...prev, quality_verified: true }))}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Pass
                      </Button>
                      <Button 
                        variant={!verifyData.quality_verified ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => setVerifyData(prev => ({ ...prev, quality_verified: false }))}
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Fail
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Quality Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Enter quality verification notes"
                      value={verifyData.quality_notes}
                      onChange={(e) => setVerifyData(prev => ({ ...prev, quality_notes: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="certificate">Inspector Certificate (Optional)</Label>
                    <Input
                      id="certificate"
                      placeholder="Certificate URL or ID"
                      value={verifyData.inspector_certificate}
                      onChange={(e) => setVerifyData(prev => ({ ...prev, inspector_certificate: e.target.value }))}
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button 
                      onClick={handleVerifyBatch} 
                      variant="gradient" 
                      disabled={isLoading}
                      className="flex-1"
                    >
                      {isLoading ? 'Verifying...' : 'Verify Batch'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowVerifyDialog(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* User Management */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">User Management ({users.length})</h2>
          </div>

          {users.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Users Found</h3>
                <p className="text-muted-foreground">No users are registered in the system</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {users.map((user) => (
                <Card key={user.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{user.name}</CardTitle>
                      <div className="flex space-x-2">
                        <Badge variant="secondary" className={`${getRoleColor(user.role)} text-white`}>
                          {user.role.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className={`${getStatusColor(user.status)} text-white`}>
                          {user.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription>{user.email}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Batches</p>
                        <p className="font-medium">{user.statistics.total_batches}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Transactions</p>
                        <p className="font-medium">{user.statistics.total_transactions}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Value</p>
                        <p className="font-medium">${user.statistics.total_value.toFixed(0)}</p>
                      </div>
                    </div>
                    
                    <div className="pt-2 space-y-2">
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserDetails(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                        
                        {user.status === 'active' ? (
                          <Button 
                            variant="destructive" 
                            size="sm"
                            className="flex-1"
                            onClick={() => handleUpdateUserStatus(user.id, 'suspended')}
                          >
                            <Ban className="h-4 w-4 mr-1" />
                            Suspend
                          </Button>
                        ) : (
                          <Button 
                            variant="default" 
                            size="sm"
                            className="flex-1"
                            onClick={() => handleUpdateUserStatus(user.id, 'active')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Activate
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* User Details Dialog */}
        <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>User Details - {selectedUser?.name}</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Email</Label>
                    <p className="text-sm">{selectedUser.email}</p>
                  </div>
                  <div>
                    <Label>Role</Label>
                    <Badge className={`${getRoleColor(selectedUser.role)} text-white`}>
                      {selectedUser.role.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Badge className={`${getStatusColor(selectedUser.status)} text-white`}>
                      {selectedUser.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <Label>Joined</Label>
                    <p className="text-sm">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
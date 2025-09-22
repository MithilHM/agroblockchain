import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import { Scale, FileText, Search, Eye, LogOut, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  timestamp: string;
  old_values: any;
  new_values: any;
  user: {
    name: string;
    role: string;
  };
  batch: {
    batch_id: string;
    product_name: string;
  };
}

export default function RegulatorDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showBatchDetails, setShowBatchDetails] = useState(false);
  const [batchDetails, setBatchDetails] = useState<any>(null);
  const [searchBatchId, setSearchBatchId] = useState('');

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      setIsLoading(true);
      
      const response = await apiClient.get('/api/admin/audit-logs?limit=50');
      
      if (response.success) {
        setAuditLogs(response.data.audit_logs);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load audit logs",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchBatch = async () => {
    if (!searchBatchId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a batch ID",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await apiClient.get(`/api/batch/${searchBatchId.trim()}`);
      
      if (response.success) {
        setBatchDetails(response.data);
        setShowBatchDetails(true);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Batch not found or error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'BATCH_REGISTERED': return 'bg-green-500';
      case 'BATCH_TRANSFERRED': return 'bg-blue-500';
      case 'QUALITY_VERIFIED': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'BATCH_REGISTERED': return <CheckCircle className="h-4 w-4" />;
      case 'BATCH_TRANSFERRED': return <AlertTriangle className="h-4 w-4" />;
      case 'QUALITY_VERIFIED': return <Scale className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
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
                <Scale className="h-6 w-6 text-orange-600" />
                <h1 className="text-2xl font-bold text-foreground">Regulator Dashboard</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-2 bg-card rounded-lg border">
                <Scale className="h-4 w-4" />
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
        {/* Search Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Batch Investigation</h2>
          <Card>
            <CardContent className="p-6">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <Label htmlFor="batchSearch">Search Batch by ID</Label>
                  <Input
                    id="batchSearch"
                    placeholder="Enter batch ID to investigate"
                    value={searchBatchId}
                    onChange={(e) => setSearchBatchId(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchBatch()}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={handleSearchBatch} 
                    disabled={isLoading}
                    variant="gradient"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    {isLoading ? 'Searching...' : 'Search'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Audit Trail */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">System Audit Trail</h2>
            <Button onClick={loadAuditLogs} variant="outline" disabled={isLoading}>
              <FileText className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {auditLogs.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Audit Logs</h3>
                <p className="text-muted-foreground">No system activities recorded yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {auditLogs.map((log) => (
                <Card key={log.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${getActionColor(log.action)} text-white`}>
                          {getActionIcon(log.action)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold">
                              {log.action.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                            </h3>
                            <Badge variant="outline">
                              {log.user.role.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {log.user.name} performed this action
                          </p>
                          {log.batch && (
                            <div className="text-sm">
                              <p><strong>Batch:</strong> {log.batch.batch_id}</p>
                              <p><strong>Product:</strong> {log.batch.product_name}</p>
                            </div>
                          )}
                          {log.new_values && (
                            <div className="mt-2 text-xs bg-muted p-2 rounded">
                              <strong>Changes:</strong> {JSON.stringify(log.new_values, null, 2)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {new Date(log.timestamp).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Batch Details Dialog */}
        <Dialog open={showBatchDetails} onOpenChange={setShowBatchDetails}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Batch Investigation Results</DialogTitle>
            </DialogHeader>
            {batchDetails && (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Batch ID</Label>
                    <p className="font-mono text-sm">{batchDetails.batch.batch_id}</p>
                  </div>
                  <div>
                    <Label>Product</Label>
                    <p className="text-sm">{batchDetails.batch.product_name}</p>
                  </div>
                  <div>
                    <Label>Origin Farm</Label>
                    <p className="text-sm">{batchDetails.batch.origin_farm}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Badge>{batchDetails.batch.status.toUpperCase()}</Badge>
                  </div>
                  <div>
                    <Label>Quantity</Label>
                    <p className="text-sm">{batchDetails.batch.quantity} {batchDetails.batch.unit}</p>
                  </div>
                  <div>
                    <Label>Price per Unit</Label>
                    <p className="text-sm">${batchDetails.batch.price_per_unit}</p>
                  </div>
                  <div>
                    <Label>Harvest Date</Label>
                    <p className="text-sm">{new Date(batchDetails.batch.harvest_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label>Quality Grade</Label>
                    <p className="text-sm">{batchDetails.batch.quality_grade || 'Not specified'}</p>
                  </div>
                </div>

                {batchDetails.batch.blockchain_hash && (
                  <div>
                    <Label>Blockchain Hash</Label>
                    <p className="font-mono text-xs bg-muted p-2 rounded break-all">
                      {batchDetails.batch.blockchain_hash}
                    </p>
                  </div>
                )}

                {batchDetails.transfer_history && batchDetails.transfer_history.length > 0 && (
                  <div>
                    <Label>Transfer History</Label>
                    <div className="space-y-2 mt-2">
                      {batchDetails.transfer_history.map((transfer: any, index: number) => (
                        <div key={index} className="border rounded p-3 text-sm">
                          <div className="flex justify-between">
                            <span>
                              <strong>From:</strong> {transfer.from_user?.name} ({transfer.from_user?.role})
                            </span>
                            <span className="text-muted-foreground">
                              {new Date(transfer.transfer_date).toLocaleDateString()}
                            </span>
                          </div>
                          <div>
                            <strong>To:</strong> {transfer.to_user?.name} ({transfer.to_user?.role})
                          </div>
                          <div>
                            <strong>Price:</strong> ${transfer.price_transferred}
                          </div>
                          {transfer.notes && (
                            <div>
                              <strong>Notes:</strong> {transfer.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
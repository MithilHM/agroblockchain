import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Login from "@/pages/Login";
import FarmerDashboard from "@/pages/FarmerDashboard";
import DistributorDashboard from "@/pages/DistributorDashboard";
import RetailerDashboard from "@/pages/RetailerDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import RegulatorDashboard from "@/pages/RegulatorDashboard";
import Profile from "@/pages/Profile";
import EnhancedProfile from "@/pages/EnhancedProfile";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  // Route based on user role
  if (user?.role === 'farmer') {
    return <FarmerDashboard />;
  }
  
  if (user?.role === 'distributor') {
    return <DistributorDashboard />;
  }
  
  if (user?.role === 'retailer') {
    return <RetailerDashboard />;
  }

  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }

  if (user?.role === 'regulator') {
    return <RegulatorDashboard />;
  }

  // Default fallback
  return <Index />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/*" element={<AppRoutes />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/enhanced-profile" element={<EnhancedProfile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

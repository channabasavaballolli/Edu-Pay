import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Auth Pages
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";

// Student Pages
import { StudentDashboard } from "./pages/student/Dashboard";
import { FeePayment } from "./pages/student/FeePayment";
import { PaymentStatus } from "./pages/student/PaymentStatus";
import { Profile } from "./pages/student/Profile";

// Admin Pages
import { AdminDashboard } from "./pages/admin/Dashboard";
import { Students } from "./pages/admin/Students";
import { AddStudent } from "./pages/admin/AddStudent";
import { AdminFeeStructure } from "./pages/admin/FeeStructure";
import { AdminPayments } from "./pages/admin/Payments";
import { AdminReports } from "./pages/admin/Reports";
import { AdminSettings } from "./pages/admin/Settings";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children, allowedRole }: { children: React.ReactNode; allowedRole?: 'student' | 'admin' }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user?.role !== allowedRole) {
    return <Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} replace />;
  }

  return <>{children}</>;
};

// Public Route (redirect if already authenticated)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

            {/* Student Routes */}
            <Route path="/student/dashboard" element={<ProtectedRoute allowedRole="student"><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/fees" element={<ProtectedRoute allowedRole="student"><FeePayment /></ProtectedRoute>} />
            <Route path="/student/payment-status" element={<ProtectedRoute allowedRole="student"><PaymentStatus /></ProtectedRoute>} />
            <Route path="/student/profile" element={<ProtectedRoute allowedRole="student"><Profile /></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/students" element={<ProtectedRoute allowedRole="admin"><Students /></ProtectedRoute>} />
            <Route path="/admin/students/add" element={<ProtectedRoute allowedRole="admin"><AddStudent /></ProtectedRoute>} />
            <Route path="/admin/students/edit/:id" element={<ProtectedRoute allowedRole="admin"><AddStudent /></ProtectedRoute>} />
            <Route path="/admin/fee-structure" element={<ProtectedRoute allowedRole="admin"><AdminFeeStructure /></ProtectedRoute>} />
            <Route path="/admin/payments" element={<ProtectedRoute allowedRole="admin"><AdminPayments /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute allowedRole="admin"><AdminReports /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute allowedRole="admin"><AdminSettings /></ProtectedRoute>} />

            {/* Catch All */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

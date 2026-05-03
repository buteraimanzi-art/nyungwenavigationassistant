import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ReliveProvider } from "@/hooks/ReliveProvider";
import { AuthProvider } from "@/hooks/use-auth";
import { RequireAuth } from "@/components/RequireAuth";
import { IndemnityGate } from "@/components/IndemnityGate";
import Index from "./pages/Index.tsx";
import Planner from "./pages/Planner.tsx";
import Features from "./pages/Features.tsx";
import Updates from "./pages/Updates.tsx";
import AuthPage from "./pages/Auth.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import AdminAlerts from "./pages/AdminAlerts.tsx";
import AdminCodes from "./pages/AdminCodes.tsx";
import AdminHikers from "./pages/AdminHikers.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <ReliveProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <IndemnityGate>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/" element={<RequireAuth><Index /></RequireAuth>} />
              <Route path="/planner" element={<RequireAuth><Planner /></RequireAuth>} />
              <Route path="/features" element={<RequireAuth><Features /></RequireAuth>} />
              <Route path="/updates" element={<RequireAuth><Updates /></RequireAuth>} />
              <Route path="/admin" element={<RequireAuth><AdminDashboard /></RequireAuth>} />
              <Route path="/admin/alerts" element={<RequireAuth><AdminAlerts /></RequireAuth>} />
              <Route path="/admin/codes" element={<RequireAuth><AdminCodes /></RequireAuth>} />
              <Route path="/admin/hikers" element={<RequireAuth><AdminHikers /></RequireAuth>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </IndemnityGate>
          </TooltipProvider>
        </ReliveProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;

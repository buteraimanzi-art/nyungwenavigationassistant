import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ReliveProvider } from "@/hooks/use-relive";
import { AuthProvider } from "@/hooks/use-auth";
import { RequireAuth } from "@/components/RequireAuth";
import Index from "./pages/Index.tsx";
import Planner from "./pages/Planner.tsx";
import Features from "./pages/Features.tsx";
import Updates from "./pages/Updates.tsx";
import AuthPage from "./pages/Auth.tsx";
import AdminAlerts from "./pages/AdminAlerts.tsx";
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
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/" element={<RequireAuth><Index /></RequireAuth>} />
              <Route path="/planner" element={<RequireAuth><Planner /></RequireAuth>} />
              <Route path="/features" element={<RequireAuth><Features /></RequireAuth>} />
              <Route path="/updates" element={<RequireAuth><Updates /></RequireAuth>} />
              <Route path="/admin/alerts" element={<RequireAuth><AdminAlerts /></RequireAuth>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </ReliveProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;

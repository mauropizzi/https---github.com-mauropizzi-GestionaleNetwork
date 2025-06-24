import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout"; // Import the new layout
import DashboardOverview from "./pages/DashboardOverview"; // Import the renamed Index page
import NotFound from "./pages/NotFound";
import ServiceRequest from "./pages/ServiceRequest";
import Anagrafiche from "./pages/Anagrafiche";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<DashboardOverview />} /> {/* Default content for the dashboard */}
            <Route path="service-request" element={<ServiceRequest />} />
            <Route path="anagrafiche" element={<Anagrafiche />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} /> {/* NotFound should still be outside the layout if it's a full page error */}
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
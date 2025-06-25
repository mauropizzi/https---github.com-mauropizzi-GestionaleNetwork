import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import DashboardOverview from "./pages/DashboardOverview";
import NotFound from "./pages/NotFound";
import ServiceRequest from "./pages/ServiceRequest";
import Anagrafiche from "./pages/Anagrafiche";
import DotazioniDiServizio from "./pages/DotazioniDiServizio";
import ServiceList from "./pages/ServiceList";
import RegistroDiCantiere from "./pages/RegistroDiCantiere";
import CentraleOperativa from "./pages/CentraleOperativa";
import ServiziCanone from "./pages/ServiziCanone"; // Import the new page

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<CentraleOperativa />} />
            <Route path="service-request" element={<ServiceRequest />} />
            <Route path="anagrafiche" element={<Anagrafiche />} />
            <Route path="dotazioni-di-servizio" element={<DotazioniDiServizio />} />
            <Route path="service-list" element={<ServiceList />} />
            <Route path="registro-di-cantiere" element={<RegistroDiCantiere />} />
            <Route path="centrale-operativa" element={<CentraleOperativa />} />
            <Route path="servizi-a-canone" element={<ServiziCanone />} /> {/* New route */}
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
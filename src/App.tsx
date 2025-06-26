import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "sonner";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardOverview from "@/pages/DashboardOverview";
import ServiceRequest from "@/pages/ServiceRequest";
import Anagrafiche from "@/pages/Anagrafiche";
import ServiceList from "@/pages/ServiceList";
import RegistroDiCantiere from "@/pages/RegistroDiCantiere";
import CentraleOperativa from "@/pages/CentraleOperativa";
import ServiziCanone from "@/pages/ServiziCanone";
import NotFound from "@/pages/NotFound";
import DotazioniDiServizio from "@/pages/DotazioniDiServizio"; // Corretto: importazione predefinita

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<DashboardOverview />} />
            <Route path="service-request" element={<ServiceRequest />} />
            <Route path="anagrafiche" element={<Anagrafiche />} />
            <Route path="service-list" element={<ServiceList />} />
            <Route path="registro-di-cantiere" element={<RegistroDiCantiere />} />
            <Route path="centrale-operativa" element={<CentraleOperativa />} />
            <Route path="servizi-canone" element={<ServiziCanone />} />
            <Route path="dotazioni-di-servizio" element={<DotazioniDiServizio />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
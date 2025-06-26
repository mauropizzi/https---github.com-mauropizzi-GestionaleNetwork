import DotazioniDiServizio from "@/pages/DotazioniDiServizio";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ServiceRequest from "@/pages/ServiceRequest";
import Anagrafiche from "@/pages/Anagrafiche";
import ServiceList from "@/pages/ServiceList";
import RegistroDiCantiere from "@/pages/RegistroDiCantiere";
import CentraleOperativa from "@/pages/CentraleOperativa";
import ServiziCanone from "@/pages/ServiziCanone";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<CentraleOperativa />} /> {/* Changed default route to CentraleOperativa */}
            <Route path="service-request" element={<ServiceRequest />} />
            <Route path="anagrafiche" element={<Anagrafiche />} />
            <Route path="dotazioni-di-servizio" element={<DotazioniDiServizio />} />
            <Route path="service-list" element={<ServiceList />} />
            <Route path="registro-di-cantiere" element={<RegistroDiCantiere />} />
            <Route path="centrale-operativa" element={<CentraleOperativa />} />
            <Route path="servizi-canone" element={<ServiziCanone />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
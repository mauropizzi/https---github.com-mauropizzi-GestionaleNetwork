import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import DashboardOverview from "./pages/DashboardOverview";
import NotFound from "./pages/NotFound";
import ServiceRequest from "./pages/ServiceRequest";
import Anagrafiche from "./pages/Anagrafiche"; // This will now redirect
import ClientiPage from "./pages/ClientiPage"; // New dedicated page
import PuntiServizioPage from "./pages/PuntiServizioPage"; // New dedicated page
import PersonalePage from "./pages/PersonalePage"; // New dedicated page
import OperatoriNetworkPage from "./pages/OperatoriNetworkPage"; // New dedicated page
import FornitoriPage from "./pages/FornitoriPage"; // New dedicated page
import TariffePage from "./pages/TariffePage"; // New dedicated page
import DotazioniDiServizio from "./pages/DotazioniDiServizio";
import ServiceList from "./pages/ServiceList";
import RegistroDiCantiere from "./pages/RegistroDiCantiere";
import CentraleOperativa from "./pages/CentraleOperativa";
import ServiziCanone from "./pages/ServiziCanone";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<CentraleOperativa />} />
            <Route path="service-request" element={<ServiceRequest />} />
            {/* Old Anagrafiche route, now redirects */}
            <Route path="anagrafiche" element={<Anagrafiche />} /> 
            {/* New dedicated Anagrafiche routes */}
            <Route path="anagrafiche/clienti" element={<ClientiPage />} />
            <Route path="anagrafiche/punti-servizio" element={<PuntiServizioPage />} />
            <Route path="anagrafiche/personale" element={<PersonalePage />} />
            <Route path="anagrafiche/operatori-network" element={<OperatoriNetworkPage />} />
            <Route path="anagrafiche/fornitori" element={<FornitoriPage />} />
            <Route path="anagrafiche/tariffe" element={<TariffePage />} />

            <Route path="dotazioni-di-servizio" element={<DotazioniDiServizio />} />
            <Route path="service-list" element={<ServiceList />} />
            <Route path="registro-di-cantiere" element={<RegistroDiCantiere />} />
            <Route path="centrale-operativa" element={<CentraleOperativa />} />
            <Route path="servizi-a-canone" element={<ServiziCanone />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
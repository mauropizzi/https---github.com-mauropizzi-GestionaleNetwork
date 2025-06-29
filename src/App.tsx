import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import PublicFormLayout from "./components/layout/PublicFormLayout"; // Import new public layout
import DashboardOverview from "./pages/DashboardOverview";
import NotFound from "./pages/NotFound";
import ServiceRequest from "./pages/ServiceRequest";
import Anagrafiche from "./pages/Anagrafiche";
import ClientiPage from "./pages/ClientiPage";
import PuntiServizioPage from "./pages/PuntiServizioPage";
import PersonalePage from "./pages/PersonalePage";
import OperatoriNetworkPage from "./pages/OperatoriNetworkPage";
import FornitoriPage from "./pages/FornitoriPage";
import TariffePage from "./pages/TariffePage";
import DotazioniDiServizio from "./pages/DotazioniDiServizio";
import ServiceList from "./pages/ServiceList";
import RegistroDiCantiere from "./pages/RegistroDiCantiere";
import CentraleOperativa from "./pages/CentraleOperativa";
import ServiziCanone from "./pages/ServiziCanone";
import EditAlarmEventPage from "./pages/EditAlarmEventPage";
import PublicSuccessPage from "./pages/PublicSuccessPage"; // Import new public success page

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Authenticated routes */}
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<CentraleOperativa />} />
            <Route path="service-request" element={<ServiceRequest />} />
            <Route path="anagrafiche" element={<Anagrafiche />} /> 
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
            <Route path="centrale-operativa/edit/:id" element={<EditAlarmEventPage />} />
            <Route path="servizi-a-canone" element={<ServiziCanone />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Public routes (no dashboard layout) */}
          <Route path="/public" element={<PublicFormLayout />}>
            <Route path="alarm-event/edit/:id" element={<EditAlarmEventPage />} />
            <Route path="success" element={<PublicSuccessPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
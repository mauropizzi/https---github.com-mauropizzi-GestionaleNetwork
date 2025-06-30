import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import PublicFormLayout from "./components/layout/PublicFormLayout";
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
import ProcedurePage from "./pages/ProcedurePage";
import DotazioniDiServizio from "./pages/DotazioniDiServizio";
import ServiceList from "./pages/ServiceList";
import RegistroDiCantiere from "./pages/RegistroDiCantiere";
import CentraleOperativa from "./pages/CentraleOperativa";
import ServiziCanone from "./pages/ServiziCanone";
import EditAlarmEventPage from "./pages/EditAlarmEventPage";
import PublicSuccessPage from "./pages/PublicSuccessPage";
import Login from "./pages/Login";
import { SessionContextProvider, useSession } from "./components/auth/SessionContextProvider";
import IncomingEmailsPage from "./pages/IncomingEmails"; // Importazione ora come default export

const queryClient = new QueryClient();

// Componente per proteggere le rotte
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useSession();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-xl text-gray-600 dark:text-gray-400">Caricamento sessione...</p>
      </div>
    );
  }

  if (!session) {
    // Reindirizza al login se non autenticato
    return <Login />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <>
      <Toaster />
      <Sonner />
      <TooltipProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <SessionContextProvider>
            <Routes>
              {/* Public routes (no dashboard layout, no auth required) */}
              <Route path="/login" element={<Login />} />
              <Route path="/public" element={<PublicFormLayout />}>
                <Route path="alarm-event/edit/:id" element={<EditAlarmEventPage />} />
                <Route path="success" element={<PublicSuccessPage />} />
              </Route>

              {/* Authenticated routes */}
              <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<CentraleOperativa />} />
                <Route path="service-request" element={<ServiceRequest />} />
                <Route path="anagrafiche" element={<Anagrafiche />} /> 
                <Route path="anagrafiche/clienti" element={<ClientiPage />} />
                <Route path="anagrafiche/punti-servizio" element={<PuntiServizioPage />} />
                <Route path="anagrafiche/personale" element={<PersonalePage />} />
                <Route path="anagrafiche/operatori-network" element={<OperatoriNetworkPage />} />
                <Route path="anagrafiche/fornitori" element={<FornitoriPage />} />
                <Route path="anagrafiche/tariffe" element={<TariffePage />} />
                <Route path="anagrafiche/procedure" element={<ProcedurePage />} />
                <Route path="dotazioni-di-servizio" element={<DotazioniDiServizio />} />
                <Route path="service-list" element={<ServiceList />} />
                <Route path="registro-di-cantiere" element={<RegistroDiCantiere />} />
                <Route path="centrale-operativa" element={<CentraleOperativa />} />
                <Route path="centrale-operativa/edit/:id" element={<EditAlarmEventPage />} />
                <Route path="servizi-a-canone" element={<ServiziCanone />} />
                <Route path="incoming-emails" element={<IncomingEmailsPage />} /> {/* New route */}
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </SessionContextProvider>
        </BrowserRouter>
      </TooltipProvider>
    </>
  </QueryClientProvider>
);

export default App;
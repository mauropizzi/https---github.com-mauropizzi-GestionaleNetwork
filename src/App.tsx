import React from "react"; // Explicitly import React
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, useNavigate, Navigate } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import PublicFormLayout from "./components/layout/PublicFormLayout";
import { SessionContextProvider, useSession } from "./components/auth/SessionContextProvider";
import { Toaster } from "@/components/ui/toaster"; // Ensure Toaster is imported if needed globally
import { Toaster as Sonner } from "@/components/ui/sonner"; // Ensure Sonner is imported if needed globally

// Lazily load all page components
const DashboardOverview = React.lazy(() => import("./pages/DashboardOverview"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const ServiceRequest = React.lazy(() => import("./pages/ServiceRequest"));
const Anagrafiche = React.lazy(() => import("./pages/Anagrafiche"));
const ClientiPage = React.lazy(() => import("./pages/ClientiPage"));
const PuntiServizioPage = React.lazy(() => import("./pages/PuntiServizioPage"));
const PersonalePage = React.lazy(() => import("./pages/PersonalePage"));
const OperatoriNetworkPage = React.lazy(() => import("./pages/OperatoriNetworkPage"));
const FornitoriPage = React.lazy(() => import("./pages/FornitoriPage"));
const TariffePage = React.lazy(() => import("./pages/TariffePage"));
const ProcedurePage = React.lazy(() => import("./pages/ProcedurePage"));
const DotazioniDiServizio = React.lazy(() => import("./pages/DotazioniDiServizio"));
const ServiceList = React.lazy(() => import("./pages/ServiceList"));
const RegistroDiCantiere = React.lazy(() => import("./pages/RegistroDiCantiere"));
const CentraleOperativa = React.lazy(() => import("./pages/CentraleOperativa"));
const ServiziCanone = React.lazy(() => import("./pages/ServiziCanone"));
const EditAlarmEventPage = React.lazy(() => import("./pages/EditAlarmEventPage"));
const PublicSuccessPage = React.lazy(() => import("./pages/PublicSuccessPage"));
const Login = React.lazy(() => import("./pages/Login"));
const IncomingEmailsPage = React.lazy(() => import("./pages/IncomingEmails"));
const AnalisiContabile = React.lazy(() => import("./pages/AnalisiContabile"));
const EditServiceRequestPage = React.lazy(() => import("./pages/EditServiceRequestPage"));
const RichiestaManutenzione = React.lazy(() => import("./pages/RichiestaManutenzione")); // New lazy import

const queryClient = new QueryClient();

// Flag per disabilitare temporaneamente l'autenticazione durante lo sviluppo
// Imposta a `false` per riabilitare il login.
const IS_AUTH_DISABLED_TEMPORARILY = false;

// Componente per proteggere le rotte
const ProtectedRoute = () => {
  const { session, loading } = useSession();
  console.log('ProtectedRoute: Session status - loading:', loading, 'session:', session ? 'present' : 'null');

  if (IS_AUTH_DISABLED_TEMPORARILY) {
    console.log('ProtectedRoute: Authentication is temporarily disabled. Bypassing login.');
    return <Outlet />; // Bypass login
  }

  if (loading) {
    console.log('ProtectedRoute: Session is loading, showing loading message.');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-xl text-gray-600 dark:text-gray-400">Caricamento sessione...</p>
      </div>
    );
  }

  if (!session) {
    // Reindirizza al login se non autenticato
    console.log('ProtectedRoute: No session found, redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  // Render nested routes if authenticated
  console.log('ProtectedRoute: Session found, rendering protected content.');
  return <Outlet />;
};

const App = () => (
  <>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <SessionContextProvider>
            <Routes>
              {/* Public routes (no dashboard layout, no auth required) */}
              <Route path="/login" element={
                <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900"><p className="text-xl text-gray-600 dark:text-gray-400">Caricamento...</p></div>}>
                  <Login />
                </React.Suspense>
              } />
              <Route path="/public" element={<PublicFormLayout />}>
                <Route path="alarm-event/edit/:id" element={
                  <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900"><p className="text-xl text-gray-600 dark:text-gray-400">Caricamento...</p></div>}>
                    <EditAlarmEventPage />
                  </React.Suspense>
                } />
                <Route path="success" element={
                  <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900"><p className="text-xl text-gray-600 dark:text-gray-400">Caricamento...</p></div>}>
                    <PublicSuccessPage />
                  </React.Suspense>
                } />
              </Route>

              {/* Authenticated routes wrapped by ProtectedRoute */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<DashboardLayout />}>
                  <Route index element={
                    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900"><p className="text-xl text-gray-600 dark:text-gray-400">Caricamento...</p></div>}>
                      <CentraleOperativa />
                    </React.Suspense>
                  } />
                  {/* Aggiunto un percorso esplicito per /centrale-operativa */}
                  <Route path="centrale-operativa" element={
                    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900"><p className="text-xl text-gray-600 dark:text-gray-400">Caricamento...</p></div>}>
                      <CentraleOperativa />
                    </React.Suspense>
                  } />
                  <Route path="service-request" element={
                    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900"><p className="text-xl text-gray-600 dark:text-gray-400">Caricamento...</p></div>}>
                      <ServiceRequest />
                    </React.Suspense>
                  } />
                  <Route path="anagrafiche" element={
                    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900"><p className="text-xl text-gray-600 dark:text-gray-400">Caricamento...</p></div>}>
                      <Anagrafiche />
                    </React.Suspense>
                  } />
                  <Route path="anagrafiche/clienti" element={
                    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900"><p className="text-xl text-gray-600 dark:text-gray-400">Caricamento...</p></div>}>
                      <ClientiPage />
                    </React.Suspense>
                  } />
                  <Route path="anagrafiche/punti-servizio" element={
                    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900"><p className="text-xl text-gray-600 dark:text-gray-400">Caricamento...</p></div>}>
                      <PuntiServizioPage />
                    </React.Suspense>
                  } />
                  <Route path="anagrafiche/personale" element={
                    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900"><p className="text-xl text-gray-600 dark:text-gray-400">Caricamento...</p></div>}>
                      <PersonalePage />
                    </React.Suspense>
                  } />
                  <Route path="anagrafiche/operatori-network" element={
                    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900"><p className="text-xl text-gray-600 dark:text-gray-400">Caricamento...</p></div>}>
                      <OperatoriNetworkPage />
                    </React.Suspense>
                  } />
                  <Route path="anagrafiche/fornitori" element={
                    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900"><p className="text-xl text-gray-600 dark:text-gray-400">Caricamento...</p></div>}>
                      <FornitoriPage />
                    </React.Suspense>
                  } />
                  <Route path="anagrafiche/tariffe" element={
                    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900"><p className="text-xl text-gray-600 dark:text-gray-400">Caricamento...</p></div>}>
                      <TariffePage />
                    </React.Suspense>
                  } />
                  <Route path="anagrafiche/procedure" element={
                    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900"><p className="text-xl text-gray-600 dark:text-gray-400">Caricamento...</p></div>}>
                      <ProcedurePage />
                    </React.Suspense>
                  } />
                  <Route path="dotazioni-di-servizio" element={
                    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900"><p className="text-xl text-gray-600 dark:text-gray-400">Caricamento...</p></div>}>
                      <DotazioniDiServizio />
                    </React.Suspense>
                  } />
                  <Route path="service-list" element={
                    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900"><p className="text-xl text-gray-600 dark:text-gray-400">Caricamento...</p></div>}>
                      <ServiceList />
                    </React.Suspense>
                  } />
                  <Route path="service-list/edit/:id" element={
                    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900"><p className="text-xl text-gray-600 dark:text-gray-400">Caricamento...</p></div>}>
                      <EditServiceRequestPage />
                    </React.Suspense>
                  } />
                  <Route path="registro-di-cantiere" element={
                    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900"><p className="text-xl text-gray-600 dark:text-gray-400">Caricamento...</p></div>}>
                      <RegistroDiCantiere />
                    </React.Suspense>
                  } />
                  <Route path="centrale-operativa/edit/:id" element={
                    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900"><p className="text-xl text-gray-600 dark:text-gray-400">Caricamento...</p></div>}>
                      <EditAlarmEventPage />
                    </React.Suspense>
                  } />
                  <Route path="servizi-a-canone" element={
                    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900"><p className="text-xl text-gray-600 dark:text-gray-400">Caricamento...</p></div>}>
                      <ServiziCanone />
                    </React.Suspense>
                  } />
                  <Route path="incoming-emails" element={
                    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900"><p className="text-xl text-gray-600 dark:text-gray-400">Caricamento...</p></div>}>
                      <IncomingEmailsPage />
                    </React.Suspense>
                  } />
                  <Route path="analisi-contabile" element={
                    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900"><p className="text-xl text-gray-600 dark:text-gray-400">Caricamento...</p></div>}>
                      <AnalisiContabile />
                    </React.Suspense>
                  } />
                  <Route path="richiesta-manutenzione" element={
                    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900"><p className="text-xl text-gray-600 dark:text-gray-400">Caricamento...</p></div>}>
                      <RichiestaManutenzione />
                    </React.Suspense>
                  } />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={
                    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900"><p className="text-xl text-gray-600 dark:text-gray-400">Caricamento...</p></div>}>
                      <NotFound />
                    </React.Suspense>
                  } />
                </Route>
              </Route>
            </Routes>
          </SessionContextProvider>
        </BrowserRouter>
      </TooltipProvider>
    </>
  );
};

export default App;
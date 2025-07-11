import React from "react"; // Explicitly import React
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, useNavigate, Navigate, useLocation } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import PublicFormLayout from "./components/layout/PublicFormLayout";
import { SessionContextProvider, useSession } from "./components/auth/SessionContextProvider";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { useUserRole } from "@/hooks/use-user-role"; // Import useUserRole
import { appRoutes } from "@/lib/app-routes"; // Import appRoutes

// Lazily load all page components
const DashboardOverview = React.lazy(() => import("@/pages/DashboardOverview.tsx"));
const NotFound = React.lazy(() => import("@/pages/NotFound.tsx"));
const ServiceRequest = React.lazy(() => import("@/pages/ServiceRequest.tsx"));
const Anagrafiche = React.lazy(() => import("@/pages/Anagrafiche.tsx"));
const ClientiPage = React.lazy(() => import("@/pages/ClientiPage.tsx"));
const PuntiServizioPage = React.lazy(() => import("@/pages/PuntiServizioPage.tsx"));
const PersonalePage = React.lazy(() => import("@/pages/PersonalePage.tsx"));
const OperatoriNetworkPage = React.lazy(() => import("@/pages/OperatoriNetworkPage.tsx"));
const FornitoriPage = React.lazy(() => import("@/pages/FornitoriPage.tsx"));
const TariffePage = React.lazy(() => import("@/pages/TariffePage.tsx"));
const ProcedurePage = React.lazy(() => import("@/pages/ProcedurePage.tsx"));
const DotazioniDiServizio = React.lazy(() => import("@/pages/DotazioniDiServizio.tsx"));
const ServiceList = React.lazy(() => import("@/pages/ServiceList.tsx"));
const RegistroDiCantiere = React.lazy(() => import("@/pages/RegistroDiCantiere.tsx"));
const CentraleOperativa = React.lazy(() => import("@/pages/CentraleOperativa.tsx"));
const ServiziCanone = React.lazy(() => import("@/pages/ServiziCanone.tsx"));
const EditAlarmEventPage = React.lazy(() => import("@/pages/EditAlarmEventPage.tsx"));
const PublicSuccessPage = React.lazy(() => import("@/pages/PublicSuccessPage.tsx"));
const Login = React.lazy(() => import("@/pages/Login.tsx"));
const IncomingEmailsPage = React.lazy(() => import("@/pages/IncomingEmails.tsx"));
const AnalisiContabile = React.lazy(() => import("@/pages/AnalisiContabile.tsx"));
const EditServiceRequestPage = React.lazy(() => import("@/pages/EditServiceRequestPage.tsx"));
const RichiestaManutenzione = React.lazy(() => import("@/pages/RichiestaManutenzione.tsx"));
const EditServiceReportPage = React.lazy(() => import("@/pages/EditServiceReportPage.tsx"));
const EditMaintenanceRequestPage = React.lazy(() => import("@/pages/EditMaintenanceRequestPage.tsx"));
const AccessManagementPage = React.lazy(() => import("@/pages/AccessManagementPage.tsx"));
const Unauthorized = React.lazy(() => import("@/pages/Unauthorized.tsx")); // Import Unauthorized page

const queryClient = new QueryClient();

// Flag per disabilitare temporaneamente l'autenticazione durante lo sviluppo
// Imposta a `false` per riabilitare il login.
const IS_AUTH_DISABLED_TEMPORARILY = false;

// Componente per proteggere le rotte
const ProtectedRoute = () => {
  const { session, loading: sessionLoading } = useSession();
  const { userProfile, loading: userRoleLoading } = useUserRole();
  const location = useLocation();

  const loading = sessionLoading || userRoleLoading;

  console.log('ProtectedRoute: Session status - loading:', loading, 'session:', session ? 'present' : 'null', 'currentPath:', location.pathname);
  console.log('ProtectedRoute: User Profile - loading:', userRoleLoading, 'profile:', userProfile);

  if (IS_AUTH_DISABLED_TEMPORARILY) {
    console.log('ProtectedRoute: Authentication is temporarily disabled. Bypassing login.');
    return <Outlet />; // Bypass login
  }

  if (loading) {
    console.log('ProtectedRoute: Session or user role is loading, showing loading message.');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-xl text-gray-600 dark:text-gray-400">Caricamento sessione e permessi...</p>
      </div>
    );
  }

  // If session is present AND we are on the login page, redirect to home
  if (session && location.pathname === '/login') {
    console.log('ProtectedRoute: Session found on login page, redirecting to /');
    return <Navigate to="/" replace />;
  }

  // If no session, redirect to login
  if (!session) {
    console.log('ProtectedRoute: No session found, redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  // If session exists but no user profile (shouldn't happen often, but as a fallback)
  if (!userProfile) {
    console.warn('ProtectedRoute: User session exists but profile not found. Redirecting to Unauthorized.');
    return <Unauthorized />;
  }

  // Admin users always have full access
  if (userProfile.role === 'Amministratore') {
    console.log('ProtectedRoute: Admin user, granting full access.');
    return <Outlet />;
  }

  // Check if the current path is allowed for the user's role
  const currentPath = location.pathname;
  const allowedRoutes = userProfile.allowed_routes || [];

  // Special handling for dynamic routes like /edit/:id
  const isAllowed = allowedRoutes.some(allowedPath => {
    if (allowedPath.endsWith('/edit')) {
      // Check if currentPath starts with the base edit path
      return currentPath.startsWith(allowedPath);
    }
    // For exact matches or base paths like /anagrafiche
    if (allowedPath === '/anagrafiche/clienti' && currentPath.startsWith('/anagrafiche')) {
      // If /anagrafiche/clienti is allowed, allow all /anagrafiche/* routes except /anagrafiche/procedure
      return !currentPath.startsWith('/anagrafiche/procedure');
    }
    if (allowedPath === '/anagrafiche/procedure' && currentPath.startsWith('/anagrafiche/procedure')) {
      // If /anagrafiche/procedure is specifically allowed
      return true;
    }
    return currentPath === allowedPath;
  });

  if (!isAllowed) {
    console.log(`ProtectedRoute: User role '${userProfile.role}' not allowed to access '${currentPath}'. Allowed routes:`, allowedRoutes);
    return <Unauthorized />;
  }

  // Render nested routes if authenticated and authorized
  console.log('ProtectedRoute: User authenticated and authorized, rendering protected content.');
  return <Outlet />;
};

const App = () => {
  return (
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
                    <Route path="dotazioni-di-servizio/edit/:id" element={
                      <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900"><p className="text-xl text-gray-600 dark:text-gray-400">Caricamento...</p></div>}>
                        <EditServiceReportPage />
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
                    <Route path="richiesta-manutenzione/edit/:id" element={ // New route for editing maintenance requests
                      <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900"><p className="text-xl text-gray-600 dark:text-gray-400">Caricamento...</p></div>}>
                        <EditMaintenanceRequestPage />
                      </React.Suspense>
                    } />
                    <Route path="access-management" element={
                      <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900"><p className="text-xl text-gray-600 dark:text-gray-400">Caricamento...</p></div>}>
                        <AccessManagementPage />
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
      </QueryClientProvider>
    </>
  );
};

export default App;
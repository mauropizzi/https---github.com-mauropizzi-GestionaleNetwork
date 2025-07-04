import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { SessionContextProvider, useSession } from "@/components/auth/SessionContextProvider";
import { Toaster } from "@/components/ui/toaster";
import LoginPage from "@/pages/Login";
import DashboardPage from "@/pages/Dashboard";
import ClientiListPage from "@/pages/ClientiList";
import FornitoriListPage from "@/pages/FornitoriList";
import PuntiServizioListPage from "@/pages/PuntiServizioList";
import PersonaleListPage from "@/pages/PersonaleList";
import OperatoriNetworkPage from "@/pages/OperatoriNetworkPage";
import ServiziCanonePage from "@/pages/ServiziCanone";
import RegistroDiCantierePage from "@/pages/RegistroDiCantiere";
import AnalisiContabilePage from "@/pages/AnalisiContabile";
import ServiceListPage from "@/pages/ServiceList";
import DotazioniDiServizioPage from "@/pages/DotazioniDiServizio";

// PrivateRoute component to protect routes
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, isLoading } = useSession(); // Changed 'loading' to 'isLoading'

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Caricamento...</div>;
  }

  return session ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <SessionContextProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/clienti"
            element={
              <PrivateRoute>
                <ClientiListPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/fornitori"
            element={
              <PrivateRoute>
                <FornitoriListPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/punti-servizio"
            element={
              <PrivateRoute>
                <PuntiServizioListPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/personale"
            element={
              <PrivateRoute>
                <PersonaleListPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/operatori-network"
            element={
              <PrivateRoute>
                <OperatoriNetworkPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/servizi-canone"
            element={
              <PrivateRoute>
                <ServiziCanonePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/registro-cantiere"
            element={
              <PrivateRoute>
                <RegistroDiCantierePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/analisi-contabile"
            element={
              <PrivateRoute>
                <AnalisiContabilePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/service-requests"
            element={
              <PrivateRoute>
                <ServiceListPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/dotazioni-di-servizio"
            element={
              <PrivateRoute>
                <DotazioniDiServizioPage />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
      <Toaster />
    </SessionContextProvider>
  );
}

export default App;
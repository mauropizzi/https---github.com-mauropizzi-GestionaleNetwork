import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MenuIcon } from "lucide-react";
import { InProgressEventsCounter } from "@/components/centrale-operativa/InProgressEventsCounter"; // Import the new component

const DashboardLayout = () => {
  const isMobile = useIsMobile();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const location = useLocation();

  // Close the sheet when the route changes on mobile
  React.useEffect(() => {
    if (isMobile) {
      setIsSheetOpen(false);
    }
  }, [location.pathname, location.search, isMobile]);

  const getPageTitle = () => {
    switch (location.pathname) {
      case "/":
        return "Centrale Operativa"; // Changed title for the root path
      case "/service-request":
        return "Richiesta Servizi";
      case "/anagrafiche":
        return "Gestione Anagrafiche";
      case "/dotazioni-di-servizio":
        return "Dotazioni di Servizio";
      case "/service-list":
        return "Elenco Servizi Richiesti";
      case "/registro-di-cantiere":
        return "Registro di Cantiere";
      case "/centrale-operativa":
        return "Centrale Operativa";
      case "/servizi-a-canone":
        return "Servizi a Canone";
      case "/incoming-emails":
        return "Email in Arrivo";
      case "/analisi-contabile":
        return "Analisi Contabile";
      case "/richiesta-manutenzione":
        return "Richieste di Manutenzione";
      case "/access-levels": // New case for Access Levels
        return "Livelli di Accesso";
      default:
        // Handle dynamic routes like /centrale-operativa/edit/:id
        if (location.pathname.startsWith("/centrale-operativa/edit/")) {
          return "Modifica Evento Allarme";
        }
        if (location.pathname.startsWith("/service-list/edit/")) {
          return "Modifica Servizio Richiesto";
        }
        if (location.pathname.startsWith("/dotazioni-di-servizio/edit/")) {
          return "Modifica Rapporto Dotazioni";
        }
        if (location.pathname.startsWith("/richiesta-manutenzione/edit/")) {
          return "Modifica Richiesta Manutenzione";
        }
        return "Dashboard";
    }
  };

  const isCentraleOperativaPage = location.pathname === "/" || location.pathname.startsWith("/centrale-operativa");

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col">
          <div className="p-4 text-2xl font-bold text-sidebar-primary-foreground">
            Security App
          </div>
          <Sidebar />
        </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-border bg-card shadow-sm">
          {isMobile && (
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MenuIcon className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 flex flex-col bg-sidebar text-sidebar-foreground">
                <div className="p-4 text-2xl font-bold text-sidebar-primary-foreground border-b border-sidebar-border">
                  Security App
                </div>
                <Sidebar onLinkClick={() => setIsSheetOpen(false)} />
              </SheetContent>
            </Sheet>
          )}
          <h1 className="text-2xl font-semibold ml-4">{getPageTitle()}</h1>
          {isCentraleOperativaPage && (
            <div className="ml-auto mr-4">
              <InProgressEventsCounter />
            </div>
          )}
        </header>
        <div className="flex-1 overflow-auto p-4">
          <Outlet /> {/* This is where nested routes will render */}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
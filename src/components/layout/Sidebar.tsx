import React from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Home, FileText, Users, Briefcase, Building2, Package, Key, DoorOpen, ListChecks, Car, ClipboardList, Radio, Euro, Repeat, FileTextIcon, MailOpen, BarChart2, Wrench, Shield } from "lucide-react"; // Import BarChart2 for Analisi Contabile, Wrench for Richiesta Manutenzione, Shield for Access Management
import { PrefetchLink } from "./PrefetchLink"; // Import the new PrefetchLink

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  subItems?: NavItem[];
}

const navItems: NavItem[] = [
  {
    title: "Centrale Operativa",
    href: "/",
    icon: Radio,
  },
  {
    title: "Richiesta Servizi",
    href: "/service-request",
    icon: FileText,
    subItems: [
      { title: "Piantonamento", href: "/service-request?tab=piantonamento", icon: Briefcase },
      { title: "Servizi Fiduciari", href: "/service-request?tab=fiduciari", icon: Users },
      { title: "Ispezioni", href: "/service-request?tab=ispezioni", icon: Package },
      { title: "Bonifiche", href: "/service-request?tab=bonifiche", icon: Key },
      { title: "Gestione Chiavi", href: "/service-request?tab=chiavi", icon: Key },
      { title: "Apertura/Chiusura", href: "/service-request?tab=apertura-chiusura", icon: DoorOpen },
    ],
  },
  {
    title: "Elenco Servizi Richiesti",
    href: "/service-list",
    icon: ListChecks,
  },
  {
    title: "Servizi a Canone",
    href: "/servizi-a-canone",
    icon: Repeat,
  },
  {
    title: "Dotazioni di Servizio",
    href: "/dotazioni-di-servizio",
    icon: Car,
  },
  {
    title: "Registro di Cantiere",
    href: "/registro-di-cantiere",
    icon: ClipboardList,
  },
  {
    title: "Anagrafiche",
    href: "/anagrafiche/clienti", // Point to the default Anagrafiche page (Clienti)
    icon: Building2,
    subItems: [
      { title: "Clienti", href: "/anagrafiche/clienti", icon: Users },
      { title: "Punti Servizio", href: "/anagrafiche/punti-servizio", icon: Building2 },
      { title: "Personale", href: "/anagrafiche/personale", icon: Users },
      { title: "Operatori Network", href: "/anagrafiche/operatori-network", icon: Briefcase },
      { title: "Fornitori", href: "/anagrafiche/fornitori", icon: Package },
      { title: "Tariffe", href: "/anagrafiche/tariffe", icon: Euro },
      { title: "Procedure", href: "/anagrafiche/procedure", icon: FileTextIcon },
    ],
  },
  {
    title: "Email in Arrivo", // New top-level item
    href: "/incoming-emails",
    icon: MailOpen,
  },
  {
    title: "Analisi Contabile", // New top-level item
    href: "/analisi-contabile",
    icon: BarChart2, // Using BarChart2 icon
  },
  {
    title: "Richiesta Manutenzione", // New top-level item
    href: "/richiesta-manutenzione",
    icon: Wrench, // Using Wrench icon
  },
  {
    title: "Gestione Accessi",
    href: "/access-management",
    icon: Shield,
  },
];

interface SidebarProps {
  onLinkClick?: () => void;
}

export function Sidebar({ onLinkClick }: SidebarProps) {
  const location = useLocation();

  const isLinkActive = (href: string) => {
    const [path, query] = href.split('?');
    if (query) {
      return location.pathname === path && location.search === `?${query}`;
    }
    // For top-level Anagrafiche link, check if current path starts with /anagrafiche
    if (path === "/anagrafiche/clienti" && location.pathname.startsWith("/anagrafiche") && !location.pathname.includes("/anagrafiche/procedure")) {
      return true;
    }
    // For Procedure link, check if current path starts with /anagrafiche/procedure
    if (path === "/anagrafiche/procedure" && location.pathname.startsWith("/anagrafiche/procedure")) {
      return true;
    }
    return location.pathname === path;
  };

  return (
    <ScrollArea className="h-full py-4 px-3">
      <div className="space-y-4">
        {navItems.map((item) => (
          <div key={item.title} className="space-y-1">
            <PrefetchLink to={item.href} onClick={onLinkClick}>
              <Button
                variant={isLinkActive(item.href) ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isLinkActive(item.href) && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                )}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.title}
              </Button>
            </PrefetchLink>
            {item.subItems && (
              <div className="ml-4 space-y-1 border-l border-sidebar-border pl-2">
                {item.subItems.map((subItem) => (
                  <PrefetchLink key={subItem.title} to={subItem.href} onClick={onLinkClick}>
                    <Button
                      variant={isLinkActive(subItem.href) ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start text-sm",
                        isLinkActive(subItem.href) && "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/90"
                      )}
                    >
                      <subItem.icon className="mr-2 h-3 w-3" />
                      {subItem.title}
                    </Button>
                  </PrefetchLink>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
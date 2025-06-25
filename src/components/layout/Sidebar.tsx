import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Home, FileText, Users, Briefcase, Building2, Package, Key, DoorOpen, ListChecks, Car, ClipboardList, Radio, Euro, Repeat } from "lucide-react"; // Import Repeat icon

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
    title: "Servizi a Canone", // New top-level item
    href: "/servizi-a-canone",
    icon: Repeat, // Icon for recurring services
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
    href: "/anagrafiche",
    icon: Building2,
    subItems: [
      { title: "Clienti", href: "/anagrafiche?tab=clienti", icon: Users },
      { title: "Punti Servizio", href: "/anagrafiche?tab=punti-servizio", icon: Building2 },
      { title: "Personale", href: "/anagrafiche?tab=personale", icon: Users },
      { title: "Operatori Network", href: "/anagrafiche?tab=operatori-network", icon: Briefcase },
      { title: "Fornitori", href: "/anagrafiche?tab=fornitori", icon: Package },
      { title: "Tariffe", href: "/anagrafiche?tab=tariffe", icon: Euro },
    ],
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
    return location.pathname === path;
  };

  return (
    <ScrollArea className="h-full py-4 px-3">
      <div className="space-y-4">
        {navItems.map((item) => (
          <div key={item.title} className="space-y-1">
            <Link to={item.href} onClick={onLinkClick}>
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
            </Link>
            {item.subItems && (
              <div className="ml-4 space-y-1 border-l border-sidebar-border pl-2">
                {item.subItems.map((subItem) => (
                  <Link key={subItem.title} to={subItem.href} onClick={onLinkClick}>
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
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
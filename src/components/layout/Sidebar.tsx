import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Home, FileText, Users, Briefcase, Building2, Package, Key, DoorOpen } from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  subItems?: NavItem[];
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: Home,
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
    title: "Anagrafiche",
    href: "/anagrafiche",
    icon: Building2,
    subItems: [
      { title: "Clienti", href: "/anagrafiche?tab=clienti", icon: Users },
      { title: "Punti Servizio", href: "/anagrafiche?tab=punti-servizio", icon: Building2 },
      { title: "Personale", href: "/anagrafiche?tab=personale", icon: Users },
      { title: "Operatori Network", href: "/anagrafiche?tab=operatori-network", icon: Briefcase },
      { title: "Fornitori", href: "/anagrafiche?tab=fornitori", icon: Package },
    ],
  },
];

interface SidebarProps {
  onLinkClick?: () => void;
}

export function Sidebar({ onLinkClick }: SidebarProps) {
  const location = useLocation();

  return (
    <ScrollArea className="h-full py-4 px-3">
      <div className="space-y-4">
        {navItems.map((item) => (
          <div key={item.title} className="space-y-1">
            <Link to={item.href} onClick={onLinkClick}>
              <Button
                variant={location.pathname === item.href ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  location.pathname === item.href && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
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
                      variant={location.search === subItem.href.split('?')[1] ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start text-sm",
                        location.pathname === subItem.href.split('?')[0] && location.search === `?${subItem.href.split('?')[1]}` && "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/90"
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
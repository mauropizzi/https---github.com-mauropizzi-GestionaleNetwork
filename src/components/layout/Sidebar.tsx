import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Network,
  Truck,
  DollarSign,
  ShieldCheck,
  Car, // Icona per Dotazioni di Servizio
  Building, // Icona per Punti Servizio
  Briefcase, // Icona per Fornitori
  UserRound, // Icona per Personale
  Share2, // Icona per Operatori Network
  ReceiptText, // Icona per Tariffe
  FileText, // Icona per Registro di Cantiere
  PhoneCall, // Icona per Centrale Operativa
  Wallet, // Icona per Servizi a Canone
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Richiesta Servizi",
    href: "/service-request",
    icon: ClipboardList,
  },
  {
    title: "Elenco Servizi",
    href: "/service-list",
    icon: ClipboardList,
  },
  {
    title: "Registro di Cantiere",
    href: "/registro-di-cantiere",
    icon: FileText,
  },
  {
    title: "Centrale Operativa",
    href: "/centrale-operativa",
    icon: PhoneCall,
  },
  {
    title: "Servizi a Canone",
    href: "/servizi-canone",
    icon: Wallet,
  },
  {
    title: "Dotazioni di Servizio",
    href: "/dotazioni-di-servizio",
    icon: Car,
  },
  {
    title: "Anagrafiche",
    href: "/anagrafiche?tab=clienti", // Default to clienti tab
    icon: Users,
  },
];

interface SidebarProps {
  onLinkClick?: () => void;
}

const Sidebar = ({ onLinkClick }: SidebarProps) => {
  const location = useLocation();

  const isActive = (href: string) => {
    // Special handling for Anagrafiche to match any sub-tab
    if (href === "/anagrafiche?tab=clienti") {
      return location.pathname.startsWith("/anagrafiche");
    }
    return location.pathname === href;
  };

  return (
    <nav className="flex-1 px-2 py-4 space-y-1 overflow-auto">
      {navItems.map((item) => (
        <Link
          key={item.href}
          to={item.href}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            isActive(item.href)
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : ""
          )}
          onClick={onLinkClick}
        >
          <item.icon className="h-5 w-5" />
          {item.title}
        </Link>
      ))}
    </nav>
  );
};

export default Sidebar;
import { Car, LayoutDashboard, FileText, Users, Briefcase, ClipboardList, BellRing, DollarSign } from "lucide-react"; // Aggiungi Car qui
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  {
    title: "Centrale Operativa",
    href: "/centrale-operativa",
    icon: BellRing,
  },
  {
    title: "Richiesta Servizi",
    href: "/service-request",
    icon: FileText,
  },
  {
    title: "Elenco Servizi Richiesti",
    href: "/service-list",
    icon: ClipboardList,
  },
  {
    title: "Registro di Cantiere",
    href: "/registro-di-cantiere",
    icon: LayoutDashboard,
  },
  {
    title: "Dotazioni di Servizio",
    href: "/dotazioni-di-servizio",
    icon: Car,
  },
  {
    title: "Gestione Anagrafiche",
    href: "/anagrafiche",
    icon: Users,
  },
  {
    title: "Servizi a Canone",
    href: "/servizi-canone",
    icon: DollarSign,
  },
];

interface SidebarProps {
  onLinkClick?: () => void;
}

export function Sidebar({ onLinkClick }: SidebarProps) {
  return (
    <ScrollArea className="flex-1 py-4">
      <nav className="grid items-start px-4 text-sm font-medium">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:text-sidebar-primary",
                isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""
              )
            }
            onClick={onLinkClick}
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </NavLink>
        ))}
      </nav>
    </ScrollArea>
  );
}
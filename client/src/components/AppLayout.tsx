import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Settings,
  LogOut,
  Menu,
  X,
  Wrench,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { useLocalAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/ordens", label: "Ordens de Serviço", icon: ClipboardList },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

const adminNavItems = [
  { href: "/usuarios", label: "Usuários", icon: ShieldCheck },
];

function NavLink({
  href,
  label,
  icon: Icon,
  onClick,
}: {
  href: string;
  label: string;
  icon: any;
  onClick?: () => void;
}) {
  const [location] = useLocation();
  const active = location === href || (href !== "/dashboard" && location.startsWith(href));

  return (
    <Link href={href} onClick={onClick}>
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer group",
          active
            ? "bg-sidebar-accent text-sidebar-primary"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        )}
      >
        <Icon
          size={18}
          className={cn(
            "shrink-0 transition-colors",
            active ? "text-sidebar-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80"
          )}
        />
        <span>{label}</span>
        {active && <ChevronRight size={14} className="ml-auto text-sidebar-primary" />}
      </div>
    </Link>
  );
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useLocalAuth();

  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="px-5 py-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sidebar-primary flex items-center justify-center shrink-0">
            <Wrench size={18} className="text-sidebar-primary-foreground" />
          </div>
          <div>
            <p className="font-display font-semibold text-sidebar-foreground text-base leading-tight">
              SysPME
            </p>
            <p className="text-sidebar-foreground/40 text-xs">Gestão de Oficina</p>
          </div>
        </div>
      </div>

      <div className="mx-4 mb-4 h-px bg-sidebar-border shrink-0" />

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} onClick={onClose} />
        ))}
        {user?.role === "admin" && (
          <>
            <div className="mx-1 my-2 h-px bg-sidebar-border" />
            <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/30">Admin</p>
            {adminNavItems.map((item) => (
              <NavLink key={item.href} {...item} onClick={onClose} />
            ))}
          </>
        )}
      </nav>

      <div className="mx-4 mt-4 mb-4 h-px bg-sidebar-border shrink-0" />

      {/* User */}
      <div className="px-4 pb-5">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground text-xs font-semibold">
              {user?.nome?.charAt(0).toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.nome}</p>
            <p className="text-xs text-sidebar-foreground/40 truncate">
              {user?.username}
              {user?.role === "admin" && (
                <span className="ml-1 text-[10px] bg-primary/20 text-primary px-1 rounded">admin</span>
              )}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 text-xs"
          onClick={() => { logout(); onClose?.(); }}
        >
          <LogOut size={14} />
          Sair
        </Button>
      </div>
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-sidebar-border">
        <SidebarContent />
      </aside>

      {/* Mobile header + drawer */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Menu size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-60 bg-sidebar border-sidebar-border">
              <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
              <SidebarContent onClose={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Wrench size={14} className="text-primary-foreground" />
            </div>
            <span className="font-display font-semibold text-foreground text-sm">SysPME</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}

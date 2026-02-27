import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  LayoutDashboard, Users, UserCircle, Wrench, Package,
  Clock, BarChart3, FileText, ChevronLeft, Menu, X,
  LogOut, Lock, History, ClipboardList
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
};

const navItemsAdmin: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Funcionários", href: "/admin/funcionarios", icon: Users },
  { label: "Clientes", href: "/admin/clientes", icon: UserCircle },
  { label: "Instalações", href: "/admin/instalacoes", icon: Wrench },
  { label: "Produtos", href: "/admin/produtos", icon: Package },
  { label: "Rel. Ponto", href: "/admin/relatorios/ponto", icon: Clock },
  { label: "Rel. Instalações", href: "/admin/relatorios/instalacoes", icon: BarChart3 },
  { label: "Rel. Materiais", href: "/admin/relatorios/materiais", icon: FileText },
];

const navItemsFuncionario: NavItem[] = [
  { label: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard },
  { label: "Ponto", href: "/app/ponto", icon: Clock },
  { label: "Orçamentos", href: "/app/orcamentos", icon: ClipboardList },
  { label: "Instalação", href: "/app/instalacoes", icon: Wrench },
  { label: "Histórico", href: "/app/historico", icon: History },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const { funcionario, isAdmin } = useAuth();
  const logoutMutation = trpc.inviolavel.logout.useMutation({
    onSuccess: () => {
      toast.success("Sessão terminada.");
      window.location.href = "/login";
    },
  });

  const navItems = isAdmin ? navItemsAdmin : navItemsFuncionario;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 text-primary-foreground">
          <Lock className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sidebar-foreground text-sm leading-tight">INVIOLÁVEL</p>
          <p className="text-xs text-muted-foreground truncate">{isAdmin ? "Administrador" : "Funcionário"}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = location === item.href || location.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href}>
              <a
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </a>
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-2 py-3 border-t border-sidebar-border">
        <div className="px-3 py-2 mb-1">
          <p className="text-sm font-medium text-sidebar-foreground truncate">{funcionario?.nome}</p>
          <p className="text-xs text-muted-foreground truncate">{funcionario?.email}</p>
        </div>
        <button
          onClick={() => logoutMutation.mutate()}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>Terminar Sessão</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-56 flex-col bg-sidebar border-r border-sidebar-border flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Sidebar Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-sidebar-border z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar mobile */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Lock className="w-5 h-5 text-primary flex-shrink-0" />
            <span className="font-bold text-sm truncate">INVIOLÁVEL</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>

        {/* Bottom Nav Mobile (Technician only) */}
        {!isAdmin && (
          <nav className="md:hidden flex items-center justify-around border-t border-border bg-card px-2 py-1.5 flex-shrink-0">
            {navItemsFuncionario.map((item) => {
              const active = location === item.href || location.startsWith(item.href + "/");
              return (
                <Link key={item.href} href={item.href}>
                  <a className={cn(
                    "flex flex-col items-center gap-1 px-3 py-1 rounded-md transition-colors",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}>
                    <item.icon className="w-5 h-5" />
                    <span className="text-[10px] font-medium">{item.label.split(" ").pop()}</span>
                  </a>
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
}

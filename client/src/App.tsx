import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminClientes from "./pages/admin/Clientes";
import ClienteForm from "./pages/admin/ClienteForm";
import ClienteDetalhe from "./pages/admin/ClienteDetalhe";
import AdminFuncionarios from "./pages/admin/Funcionarios";
import AdminInstalacoes from "./pages/admin/Instalacoes";
import AdminProdutos from "./pages/admin/Produtos";
import AdminRelatorioPonto from "./pages/admin/RelatorioPonto";
import AdminRelatorioInstalacoes from "./pages/admin/RelatorioInstalacoes";
import AdminRelatorioMateriais from "./pages/admin/RelatorioMateriais";

// App (Funcionário) pages
import AppDashboard from "./pages/app/Dashboard";
import AppPonto from "./pages/app/Ponto";
import AppInstalacoes from "./pages/app/Instalacoes";
import AppOrcamentos from "./pages/app/Orcamentos";
import AppHistorico from "./pages/app/Historico";

// Shared
import InstalacaoDetalhe from "./pages/InstalacaoDetalhe";

function ProtectedRoute({ component: Component, adminOnly = false }: { component: React.ComponentType; adminOnly?: boolean }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">A carregar...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (adminOnly && !isAdmin) {
    return <Redirect to="/app/dashboard" />;
  }

  return <Component />;
}

function Router() {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <Switch>
      {/* Rota raiz — redirecionar conforme perfil */}
      <Route path="/">
        {isAuthenticated
          ? isAdmin
            ? <Redirect to="/admin/dashboard" />
            : <Redirect to="/app/dashboard" />
          : <Redirect to="/login" />
        }
      </Route>

      {/* Login */}
      <Route path="/login" component={Login} />

      {/* ─── Admin ─────────────────────────────────────────────────────── */}
      <Route path="/admin/dashboard">
        <ProtectedRoute component={AdminDashboard} adminOnly />
      </Route>
      <Route path="/admin/clientes">
        <ProtectedRoute component={AdminClientes} adminOnly />
      </Route>
      <Route path="/admin/clientes/novo">
        <ProtectedRoute component={ClienteForm} adminOnly />
      </Route>
      <Route path="/admin/clientes/:id/editar">
        <ProtectedRoute component={ClienteForm} adminOnly />
      </Route>
      <Route path="/admin/clientes/:id">
        <ProtectedRoute component={ClienteDetalhe} adminOnly />
      </Route>
      <Route path="/admin/funcionarios">
        <ProtectedRoute component={AdminFuncionarios} adminOnly />
      </Route>
      <Route path="/admin/instalacoes">
        <ProtectedRoute component={AdminInstalacoes} adminOnly />
      </Route>
      <Route path="/admin/instalacoes/:id">
        <ProtectedRoute component={InstalacaoDetalhe} adminOnly />
      </Route>
      <Route path="/admin/produtos">
        <ProtectedRoute component={AdminProdutos} adminOnly />
      </Route>
      <Route path="/admin/relatorios/ponto">
        <ProtectedRoute component={AdminRelatorioPonto} adminOnly />
      </Route>
      <Route path="/admin/relatorios/instalacoes">
        <ProtectedRoute component={AdminRelatorioInstalacoes} adminOnly />
      </Route>
      <Route path="/admin/relatorios/materiais">
        <ProtectedRoute component={AdminRelatorioMateriais} adminOnly />
      </Route>

      {/* ─── Funcionário ───────────────────────────────────────────────── */}
      <Route path="/app/dashboard">
        <ProtectedRoute component={AppDashboard} />
      </Route>
      <Route path="/app/ponto">
        <ProtectedRoute component={AppPonto} />
      </Route>
      <Route path="/app/instalacoes">
        <ProtectedRoute component={AppInstalacoes} />
      </Route>
      <Route path="/app/orcamentos">
        <ProtectedRoute component={AppOrcamentos} />
      </Route>
      <Route path="/app/instalacoes/:id">
        <ProtectedRoute component={InstalacaoDetalhe} />
      </Route>
      <Route path="/app/historico">
        <ProtectedRoute component={AppHistorico} />
      </Route>

      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <TooltipProvider>
            <Toaster richColors position="top-right" />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LocalAuthProvider, useLocalAuth } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useEffect } from "react";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Ordens from "./pages/Ordens";
import NovaOS from "./pages/NovaOS";
import EditarOS from "./pages/EditarOS";
import DetalheOS from "./pages/DetalheOS";
import Configuracoes from "./pages/Configuracoes";
import GerenciarUsuarios from "./pages/GerenciarUsuarios";

function RootRedirect() {
  const { user, loading } = useLocalAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading) {
      if (user) {
        navigate("/dashboard");
      } else {
        navigate("/login");
      }
    }
  }, [user, loading, navigate]);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={RootRedirect} />
      <Route path="/login" component={Login} />

      <Route path="/dashboard">
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      </Route>

      <Route path="/clientes/novo">
        <ProtectedRoute><Clientes openNew /></ProtectedRoute>
      </Route>

      <Route path="/clientes">
        <ProtectedRoute><Clientes /></ProtectedRoute>
      </Route>

      <Route path="/ordens">
        <ProtectedRoute><Ordens /></ProtectedRoute>
      </Route>

      <Route path="/ordens/nova">
        <ProtectedRoute><NovaOS /></ProtectedRoute>
      </Route>

      <Route path="/ordens/:id/editar">
        {(params) => (
          <ProtectedRoute><EditarOS /></ProtectedRoute>
        )}
      </Route>

      <Route path="/ordens/:id">
        {(params) => (
          <ProtectedRoute><DetalheOS /></ProtectedRoute>
        )}
      </Route>

      <Route path="/configuracoes">
        <ProtectedRoute><Configuracoes /></ProtectedRoute>
      </Route>

      <Route path="/usuarios">
        <ProtectedRoute><GerenciarUsuarios /></ProtectedRoute>
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <LocalAuthProvider>
          <TooltipProvider>
            <Toaster richColors position="top-right" />
            <Router />
          </TooltipProvider>
        </LocalAuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

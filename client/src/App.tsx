import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import NovaMedicao from "./pages/NovaMedicao";
import Historico from "./pages/Historico";
import Graficos from "./pages/Graficos";
import Perfil from "./pages/Perfil";
import Lembretes from "./pages/Lembretes";
import Compartilhar from "./pages/Compartilhar";
import Compartilhado from "./pages/Compartilhado";
import Notificacoes from "./pages/Notificacoes";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/nova-medicao" component={NovaMedicao} />
        <Route path="/historico" component={Historico} />
        <Route path="/graficos" component={Graficos} />
        <Route path="/perfil" component={Perfil} />
        <Route path="/lembretes" component={Lembretes} />
        <Route path="/compartilhar" component={Compartilhar} />
        <Route path="/notificacoes" component={Notificacoes} />
        <Route path="/compartilhado/:token" component={Compartilhado} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-center" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

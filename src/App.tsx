
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Dashboard } from "@/components/Dashboard";
import { Clientes } from "@/components/Clientes";
import { Produtos } from "@/components/Produtos";
import { Relatorios } from "@/components/Relatorios";
import { Orcamentos } from "@/components/Orcamentos";
import { Agenda } from "@/components/Agenda";
import { Logs } from "@/components/Logs";
import { LoginPanel } from "@/components/LoginPanel";
import { AuthProvider } from "@/contexts/AuthContext";
import { LogsProvider } from "@/contexts/LogsContext";
import { DataProvider } from "@/contexts/DataContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <DataProvider>
          <LogsProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPanel />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/clientes" element={
                  <ProtectedRoute>
                    <Layout>
                      <Clientes />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/produtos" element={
                  <ProtectedRoute>
                    <Layout>
                      <Produtos />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/relatorios" element={
                  <ProtectedRoute>
                    <Layout>
                      <Relatorios />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/orcamentos" element={
                  <ProtectedRoute>
                    <Layout>
                      <Orcamentos />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/agenda" element={
                  <ProtectedRoute>
                    <Layout>
                      <Agenda />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/logs" element={
                  <ProtectedRoute>
                    <Layout>
                      <Logs />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </LogsProvider>
        </DataProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

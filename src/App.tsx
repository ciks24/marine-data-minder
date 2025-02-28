
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Layout from "./components/Layout";
import AuthGuard from "./components/AuthGuard";
import Index from "./pages/Index";
import Records from "./pages/Records";
import AuthPage from "./pages/auth/AuthPage";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "./hooks/useTheme";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <Toaster position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={
            <AuthGuard>
              <Layout>
                <Index />
              </Layout>
            </AuthGuard>
          } />
          <Route path="/records" element={
            <AuthGuard>
              <Layout>
                <Records />
              </Layout>
            </AuthGuard>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

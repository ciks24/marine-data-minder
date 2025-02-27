
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Layout from "./components/Layout";
import AuthGuard from "./components/AuthGuard";
import Index from "./pages/Index";
import Records from "./pages/Records";
import AuthPage from "./pages/auth/AuthPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Toaster position="top-right" />
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route
          element={
            <AuthGuard>
              <Layout>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/records" element={<Records />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            </AuthGuard>
          }
        />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;

import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Ship, List, LogOut, Sun, Moon, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from '@/hooks/useTheme';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Sesión cerrada exitosamente');
      navigate('/auth');
    } catch (error: any) {
      toast.error('Error al cerrar sesión');
      console.error('Error:', error.message);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar con tamaño y espaciado ajustados para móviles */}
      <nav className="bg-card border-b border-border sticky top-0 z-10 safe-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 sm:h-12">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Ship className="h-5 w-5 text-primary" />
                <span className="ml-2 text-base font-semibold text-foreground bg-background/50 px-2 py-0.5 rounded">
                  M&S Control
                </span>
              </div>
              <div className="hidden sm:ml-3 sm:flex sm:space-x-2">
                <Link
                  to="/"
                  className={`inline-flex items-center px-2 pt-1 text-sm ${
                    location.pathname === '/'
                      ? 'border-b-2 border-primary text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:border-muted transition-colors'
                  }`}
                >
                  Nuevo Registro
                </Link>
                <Link
                  to="/records"
                  className={`inline-flex items-center px-2 pt-1 text-sm ${
                    location.pathname === '/records'
                      ? 'border-b-2 border-primary text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:border-muted transition-colors'
                  }`}
                >
                  Registros
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="text-muted-foreground hover:text-foreground h-10 w-10 sm:h-8 sm:w-8"
                aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5 sm:h-4 sm:w-4" />
                ) : (
                  <Moon className="h-5 w-5 sm:h-4 sm:w-4" />
                )}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground h-10 w-10 sm:h-8 sm:w-8"
                  >
                    <Settings className="h-5 w-5 sm:h-4 sm:w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-popover text-popover-foreground">
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {/* Navegación móvil */}
          <div className="sm:hidden pb-2">
            <div className="flex space-x-4">
              <Link
                to="/"
                className={`flex-1 text-center px-3 py-2 text-sm rounded-md ${
                  location.pathname === '/'
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent transition-colors'
                }`}
              >
                Nuevo Registro
              </Link>
              <Link
                to="/records"
                className={`flex-1 text-center px-3 py-2 text-sm rounded-md ${
                  location.pathname === '/records'
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent transition-colors'
                }`}
              >
                Registros
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenido principal con padding ajustado */}
      <main className="flex-1 container mx-auto px-4 py-4 sm:px-6 lg:px-8 pb-safe">
        {children}
      </main>
    </div>
  );
};

export default Layout;


import React, { useEffect, useState } from 'react';
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
      {/* Navbar optimizado para ocupar menos espacio */}
      <nav className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex justify-between h-14">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Ship className="h-6 w-6 text-primary" />
                <span className="ml-2 text-lg font-semibold text-foreground">M&S Control</span>
              </div>
              <div className="hidden sm:ml-4 sm:flex sm:space-x-4">
                <Link
                  to="/"
                  className={`inline-flex items-center px-1 pt-1 text-sm ${
                    location.pathname === '/'
                      ? 'border-b-2 border-primary text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:border-muted transition-colors'
                  }`}
                >
                  Nuevo Registro
                </Link>
                <Link
                  to="/records"
                  className={`inline-flex items-center px-1 pt-1 text-sm ${
                    location.pathname === '/records'
                      ? 'border-b-2 border-primary text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:border-muted transition-colors'
                  }`}
                >
                  Registros
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="text-muted-foreground hover:text-foreground"
                aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Settings className="h-4 w-4" />
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
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 pb-16 sm:pb-8">
        {children}
      </main>

      {/* Barra inferior móvil optimizada para ocupar menos espacio */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-10">
        <div className="grid grid-cols-2">
          <Link
            to="/"
            className={`flex flex-col items-center py-2 ${
              location.pathname === '/' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Ship className="h-5 w-5" />
            <span className="mt-1 text-xs">Nuevo</span>
          </Link>
          <Link
            to="/records"
            className={`flex flex-col items-center py-2 ${
              location.pathname === '/records' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <List className="h-5 w-5" />
            <span className="mt-1 text-xs">Registros</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Layout;

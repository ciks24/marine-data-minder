
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
      <nav className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Ship className="h-8 w-8 text-primary" />
                <span className="ml-2 text-xl font-semibold">M&S Control</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/"
                  className={`inline-flex items-center px-1 pt-1 ${
                    location.pathname === '/'
                      ? 'border-b-2 border-primary text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:border-muted transition-colors'
                  }`}
                >
                  Nuevo Registro
                </Link>
                <Link
                  to="/records"
                  className={`inline-flex items-center px-1 pt-1 ${
                    location.pathname === '/records'
                      ? 'border-b-2 border-primary text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:border-muted transition-colors'
                  }`}
                >
                  Registros
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="text-muted-foreground hover:text-foreground"
                aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Settings className="h-5 w-5" />
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-10">
        <div className="grid grid-cols-2">
          <Link
            to="/"
            className={`flex flex-col items-center p-4 ${
              location.pathname === '/' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Ship className="h-6 w-6" />
            <span className="mt-1 text-xs">Nuevo</span>
          </Link>
          <Link
            to="/records"
            className={`flex flex-col items-center p-4 ${
              location.pathname === '/records' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <List className="h-6 w-6" />
            <span className="mt-1 text-xs">Registros</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Layout;


import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Ship, List, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Ship className="h-8 w-8 text-primary" />
                <span className="ml-2 text-xl font-semibold text-gray-900">M&S Control</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/"
                  className={`inline-flex items-center px-1 pt-1 ${
                    location.pathname === '/'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Nuevo Registro
                </Link>
                <Link
                  to="/records"
                  className={`inline-flex items-center px-1 pt-1 ${
                    location.pathname === '/records'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Registros
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="grid grid-cols-2">
          <Link
            to="/"
            className={`flex flex-col items-center p-4 ${
              location.pathname === '/' ? 'text-primary' : 'text-gray-500'
            }`}
          >
            <Ship className="h-6 w-6" />
            <span className="mt-1 text-xs">Nuevo</span>
          </Link>
          <Link
            to="/records"
            className={`flex flex-col items-center p-4 ${
              location.pathname === '/records' ? 'text-primary' : 'text-gray-500'
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

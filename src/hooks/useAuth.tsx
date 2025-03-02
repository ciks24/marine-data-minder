import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Inicializando autenticación...');
    
    // Intentar recuperar la sesión del almacenamiento local
    const savedSession = localStorage.getItem('marine-data-auth');
    if (savedSession) {
      try {
        const parsedSession = JSON.parse(savedSession);
        if (parsedSession?.access_token) {
          console.log('Sesión encontrada en localStorage');
          setSession(parsedSession);
        }
      } catch (error) {
        console.error('Error al parsear la sesión guardada:', error);
      }
    }

    // Obtener sesión inicial de Supabase
    supabase.auth.getSession().then(({ data: { session: supabaseSession } }) => {
      console.log('Sesión obtenida de Supabase:', supabaseSession ? 'Activa' : 'No activa');
      if (supabaseSession) {
        setSession(supabaseSession);
        localStorage.setItem('marine-data-auth', JSON.stringify(supabaseSession));
      }
      setLoading(false);
    });

    // Escuchar cambios en la autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      console.log('Cambio en el estado de autenticación:', _event);
      setSession(newSession);
      if (newSession) {
        localStorage.setItem('marine-data-auth', JSON.stringify(newSession));
      } else {
        localStorage.removeItem('marine-data-auth');
      }
      setLoading(false);
    });

    // Configurar intervalo para refrescar el token
    const refreshInterval = setInterval(async () => {
      try {
        console.log('Intentando refrescar el token...');
        const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();
        if (error) {
          console.error('Error al refrescar la sesión:', error);
          throw error;
        }
        if (refreshedSession) {
          console.log('Token refrescado exitosamente');
          setSession(refreshedSession);
          localStorage.setItem('marine-data-auth', JSON.stringify(refreshedSession));
        }
      } catch (error) {
        console.error('Error refrescando sesión:', error);
      }
    }, 5 * 60 * 1000); // Cada 5 minutos

    return () => {
      clearInterval(refreshInterval);
      subscription.unsubscribe();
    };
  }, []);

  return {
    user: session?.user ?? null,
    session,
    loading,
  };
};

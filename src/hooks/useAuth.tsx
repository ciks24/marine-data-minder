import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Intentar recuperar la sesión del almacenamiento local
    const savedSession = localStorage.getItem('marine-data-auth');
    if (savedSession) {
      try {
        const parsedSession = JSON.parse(savedSession);
        if (parsedSession?.access_token) {
          setSession(parsedSession);
        }
      } catch (error) {
        console.error('Error parsing saved session:', error);
      }
    }

    // Obtener sesión inicial de Supabase
    supabase.auth.getSession().then(({ data: { session: supabaseSession } }) => {
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
        const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();
        if (error) {
          throw error;
        }
        if (refreshedSession) {
          setSession(refreshedSession);
          localStorage.setItem('marine-data-auth', JSON.stringify(refreshedSession));
        }
      } catch (error) {
        console.error('Error refreshing session:', error);
      }
    }, 5 * 60 * 1000); // Refrescar cada 5 minutos

    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  return {
    session,
    loading,
    user: session?.user ?? null,
  };
};

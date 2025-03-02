// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://roncfnvmbvymjtjmqeyr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvbmNmbnZtYnZ5bWp0am1xZXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2MjA5NzQsImV4cCI6MjA1NjE5Njk3NH0.0T3ULnpe4BVrhIC2MR7g23nl3ls0lYieZzrdMKWrepE";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      storageKey: 'marine-data-auth',
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    },
    global: {
      headers: {
        'X-Client-Info': 'marine-data-minder-android'
      },
      fetch: (url, options = {}) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout

        return fetch(url, {
          ...options,
          signal: controller.signal
        }).finally(() => {
          clearTimeout(timeoutId);
        });
      }
    },
    realtime: {
      params: {
        eventsPerSecond: 2
      }
    },
    db: {
      schema: 'public'
    }
  }
);

// Función auxiliar para verificar la conexión
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('marine_services').select('count').limit(1);
    if (error) throw error;
    console.log('Conexión a Supabase exitosa');
    return true;
  } catch (error) {
    console.error('Error al verificar la conexión con Supabase:', error);
    return false;
  }
};
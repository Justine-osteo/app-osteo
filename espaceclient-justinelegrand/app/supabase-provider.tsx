'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useState, createContext, useContext } from 'react';
import type { Database } from '@/types/supabase';

const SupabaseContext = createContext<any>(null);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
    const [supabaseClient] = useState(() =>
        createBrowserClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
    );

    return (
        <SupabaseContext.Provider value={{ supabaseClient }}>
            {children}
        </SupabaseContext.Provider>
    );
}

export function useSupabase() {
    const context = useContext(SupabaseContext);
    if (!context) {
        throw new Error('useSupabase must be used within SupabaseProvider');
    }
    return context;
}

'use client';

import { SWRConfig } from 'swr';
import { fetcher } from '@/lib/fetcher';

type SWRProviderProps = {
    children: React.ReactNode;
};

export default function SWRProvider({ children }: SWRProviderProps) {
    return (
        <SWRConfig value={{ fetcher }}>
            {children}
        </SWRConfig>
    );
}

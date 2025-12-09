import './globals.css';
import { Open_Sans, Charm } from 'next/font/google';
import type { Metadata } from 'next';
import SWRProvider from '@/components/SWRProvider';
import { SupabaseProvider } from './supabase-provider';
import AuthProvider from './auth-provider'; // <--- 1. Import du composant qu'on vient de créer

const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const charm = Charm({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-title',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Votre espace client - JL ostéopathe animalier',
  description: 'Description de ton site',
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${openSans.variable} ${charm.variable} min-h-screen`}>
        <SupabaseProvider>
          {/* 2. On enveloppe le reste de l'app avec l'AuthProvider */}
          <AuthProvider>
            <SWRProvider>
              {children}
            </SWRProvider>
          </AuthProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
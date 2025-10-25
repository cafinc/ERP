'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { usePathname } from 'next/navigation';
import HybridNavigationTopBar from '@/components/HybridNavigationTopBar';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  
  // Pages that should NOT have the navigation/header (login, communications center popup, etc.)
  const isAuthPage = pathname === '/login' || pathname === '/forgot-password' || pathname === '/reset-password';
  const isStandalonePage = pathname === '/communications/center';

  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#333',
                borderRadius: '12px',
                padding: '16px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              },
              success: {
                iconTheme: {
                  primary: '#3f72af',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          {(isAuthPage || isStandalonePage) ? (
            children
          ) : (
            <HybridNavigationTopBar>{children}</HybridNavigationTopBar>
          )}
        </AuthProvider>
      </body>
    </html>
  );
}

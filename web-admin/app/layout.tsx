'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { usePathname } from 'next/navigation';
import HybridNavigationTopBar from '@/components/HybridNavigationTopBar';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  
  // Pages that should NOT have the navigation/header (login, etc.)
  const isAuthPage = pathname === '/login' || pathname === '/forgot-password' || pathname === '/reset-password';

  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          {isAuthPage ? (
            children
          ) : (
            <HybridNavigationTopBar>{children}</HybridNavigationTopBar>
          )}
        </AuthProvider>
      </body>
    </html>
  );
}

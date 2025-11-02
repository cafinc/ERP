'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AppIntegrationRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the new integrations hub
    router.replace('/integrations');
  }, [router]);
  
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1e293b', marginBottom: '12px' }}>
          Redirecting to Integration Hub...
        </h2>
        <p style={{ color: '#64748b' }}>
          App integrations have been moved to the central Integration Hub
        </p>
      </div>
    </div>
  );
}

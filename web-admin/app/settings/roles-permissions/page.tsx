'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RolesPermissionsRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the access page where roles are now managed
    router.replace('/access');
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
          Redirecting to Access Control...
        </h2>
        <p style={{ color: '#64748b' }}>
          Roles & Permissions management is now part of the Access Control dashboard
        </p>
      </div>
    </div>
  );
}

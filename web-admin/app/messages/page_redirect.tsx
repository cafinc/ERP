'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MessagesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to unified communications center
    router.replace('/communications/center');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3f72af] mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to Communications Center...</p>
      </div>
    </div>
  );
}

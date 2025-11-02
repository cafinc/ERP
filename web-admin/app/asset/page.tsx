'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AssetPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/asset/dashboard');
  }, [router]);

  return null;
}
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from '@/lib/session-context';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useSession();

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      router.replace('/?auth_error=true');
      return;
    }

    refresh().then(() => {
      router.replace('/');
    });
  }, [searchParams, refresh, router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        <p className="mt-4 text-sm text-gray-500">กำลังเข้าสู่ระบบ...</p>
      </div>
    </div>
  );
}

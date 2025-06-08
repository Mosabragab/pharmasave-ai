'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VerificationRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to profile page since verification is now inline
    router.replace('/dashboard/profile');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Redirecting to Profile...
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Verification is now part of the profile page
        </div>
      </div>
    </div>
  );
}
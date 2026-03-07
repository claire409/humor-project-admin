'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation'; // Added for better routing

export default function SignOutButton() {
  const router = useRouter(); // Initialize the router
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSignOut = async () => {
    // 1. Sign out from Supabase session
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Error signing out:', error.message);
      return;
    }

    // 2. Clear the router cache and redirect
    // Ensure this path matches your actual login page (e.g., /auth/login or just /)
    router.push('/');
    router.refresh();
  };

  return (
    <button
      onClick={handleSignOut}
      className="w-full text-left p-4 text-red-400 hover:bg-red-900/20 rounded-xl transition-all font-black uppercase text-[11px] tracking-widest"
    >
      Sign Out
    </button>
  );
}
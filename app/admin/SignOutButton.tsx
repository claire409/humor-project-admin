'use client';

import { createBrowserClient } from '@supabase/ssr';

export default function SignOutButton() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
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
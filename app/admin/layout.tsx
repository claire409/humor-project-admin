export const dynamic = 'force-dynamic';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import SignOutButton from './SignOutButton'; // Import the new client component

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_superadmin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_superadmin) {
    return (
      <div className="h-screen flex items-center justify-center bg-red-50 text-red-600 font-bold uppercase tracking-widest">
        Access Denied: Superadmins Only
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar Navigation */}
      <nav className="w-64 bg-slate-900 text-slate-300 p-6 flex flex-col shadow-xl">
        <h1 className="text-white text-xl font-black uppercase tracking-tighter px-3 mb-8">
          Admin Panel
        </h1>

        <ul className="space-y-1 text-[11px] font-black uppercase tracking-[0.15em] flex-1">
          <li>
            <Link href="/admin" className="block p-4 hover:bg-slate-800 hover:text-white rounded-xl transition-all">
              Dashboard
            </Link>
          </li>
          <li>
            <Link href="/admin/users" className="block p-4 hover:bg-slate-800 hover:text-white rounded-xl transition-all">
              Users
            </Link>
          </li>
          <li>
            <Link href="/admin/images" className="block p-4 hover:bg-slate-800 hover:text-white rounded-xl transition-all">
              Images
            </Link>
          </li>
          <li>
            <Link href="/admin/captions" className="block p-4 hover:bg-slate-800 hover:text-white rounded-xl transition-all">
              Captions
            </Link>
          </li>
        </ul>

        {/* The Client Component is safe to use here */}
        <div className="pt-6 border-t border-slate-800">
           <SignOutButton />
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-10 overflow-y-auto h-screen">
        {children}
      </main>
    </div>
  );
}
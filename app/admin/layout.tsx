import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (c) => {}, // Server components don't need to set cookies
      },
    }
  );

  // 1. Get the current user
  const { data: { user } } = await supabase.auth.getUser();

  // 2. If no user, send them to the login page (root)
  if (!user) {
    redirect('/');
  }

  // 3. Check if they have the superadmin flag in your database
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_superadmin')
    .eq('id', user.id)
    .single();

  // 4. If NOT a superadmin, block them!
  if (!profile?.is_superadmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-red-50 p-10">
        <div className="text-center">
          <h1 className="text-2xl font-black text-red-600 uppercase mb-2">Access Denied</h1>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">
            This area is for Superadmins only.
          </p>
        </div>
      </div>
    );
  }

  // 5. If they ARE a superadmin, show the admin content
  return (
    <div className="flex min-h-screen bg-slate-100">
      <nav className="w-64 bg-slate-900 text-white p-8">
        <h2 className="font-black text-xl mb-10 uppercase tracking-tighter">Admin</h2>
        <ul className="space-y-4 text-xs font-bold uppercase tracking-widest text-slate-400">
          <li className="hover:text-white cursor-pointer underline"><a href="/admin">Dashboard</a></li>
          <li className="hover:text-white cursor-pointer"><a href="/admin/images">Manage Images</a></li>
        </ul>
      </nav>
      <main className="flex-1 p-12">{children}</main>
    </div>
  );
}
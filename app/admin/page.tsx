export const dynamic = 'force-dynamic';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export default async function AdminDashboard() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  // Fetch some "Interesting Stats"
  const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
  const { count: imageCount } = await supabase.from('images').select('*', { count: 'exact', head: true });

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-black uppercase tracking-tighter">Admin Dashboard</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Users</p>
          <p className="text-4xl font-black">{userCount ?? 0}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Images</p>
          <p className="text-4xl font-black">{imageCount ?? 0}</p>
        </div>
      </div>

      <div className="bg-indigo-600 p-8 rounded-3xl text-white">
        <h2 className="text-xl font-bold italic">"Did you know?"</h2>
        <p className="opacity-80">You currently have {imageCount} memes stored in your Supabase bucket!</p>
      </div>
    </div>
  );
}
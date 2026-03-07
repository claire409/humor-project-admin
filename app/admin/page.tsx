export const dynamic = 'force-dynamic';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export default async function Dashboard() {
  const cookieStore = await cookies();
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } });

  const { count: users } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
  const { count: images } = await supabase.from('images').select('*', { count: 'exact', head: true });
  const { count: captions } = await supabase.from('captions').select('*', { count: 'exact', head: true });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black uppercase">System Overview</h2>
      <div className="grid grid-cols-3 gap-6">
        {[ { label: 'Total Profiles', val: users }, { label: 'Total Images', val: images }, { label: 'Total Captions', val: captions } ].map((s) => (
          <div key={s.label} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
            <p className="text-4xl font-black mt-2 text-slate-900">{s.val ?? 0}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
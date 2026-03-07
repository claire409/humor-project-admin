export const dynamic = 'force-dynamic';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import ClientCharts from './ClientCharts';

export default async function Dashboard() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const [
    { count: users },
    { count: images },
    { count: captions },
    { count: votes },
    { data: userData },
    { data: imageData },
    { data: captionData },
    { data: voteData }
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('images').select('*', { count: 'exact', head: true }),
    supabase.from('captions').select('*', { count: 'exact', head: true }),
    supabase.from('caption_votes').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('created_datetime_utc').gte('created_datetime_utc', '2026-01-01'),
    supabase.from('images').select('created_datetime_utc').gte('created_datetime_utc', '2026-01-01'),
    supabase.from('captions').select('created_datetime_utc').gte('created_datetime_utc', '2026-01-01'),
    supabase.from('caption_votes').select('created_datetime_utc').gte('created_datetime_utc', '2026-01-01'),
  ]);

  const stats = [
    { label: 'Total Profiles', val: users, color: 'text-blue-600' },
    { label: 'Total Images', val: images, color: 'text-emerald-600' },
    { label: 'Total Captions', val: captions, color: 'text-orange-600' },
    { label: 'Total Votes', val: votes, color: 'text-pink-600' }
  ];

  return (
    <div className="space-y-12 p-4">
      <section className="space-y-6">
      <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Dashboard</h2>
        <h2 className="text-2xl font-black uppercase tracking-tighter">System Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{s.label}</p>
              {/* FIXED: Added .toLocaleString() for comma formatting */}
              <p className={`text-4xl font-black mt-2 tracking-tighter ${s.color}`}>
                {(s.val ?? 0).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tighter">2026 Growth</h2>
        <ClientCharts
          users={userData || []}
          images={imageData || []}
          captions={captionData || []}
          votes={voteData || []}
        />
      </section>
    </div>
  );
}
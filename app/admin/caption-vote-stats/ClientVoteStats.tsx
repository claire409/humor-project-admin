'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type AnyRow = { [key: string]: any };

type DailyPoint = { day: string; count: number };
type TopCaption = { captionId: string; count: number; content?: string | null };

export default function ClientVoteStats({
  totals,
  dailySeries,
  topCaptions,
  captionsById,
}: {
  totals: {
    totalVotes: number;
    uniqueRaters: number;
    captionsRated: number;
    avgVote: number | null;
  };
  dailySeries: DailyPoint[];
  topCaptions: TopCaption[];
  captionsById: Record<string, { content?: string | null }>;
}) {
  const hydratedTopCaptions = topCaptions.map((c) => ({
    ...c,
    content: c.content ?? captionsById[c.captionId]?.content ?? null,
  }));

  return (
    <div className="space-y-10">
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Votes (all-time)
          </p>
          <p className="text-4xl font-black mt-2 tracking-tighter text-pink-600">
            {totals.totalVotes.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Unique Raters (all-time)
          </p>
          <p className="text-4xl font-black mt-2 tracking-tighter text-blue-600">
            {totals.uniqueRaters.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Captions Rated (all-time)
          </p>
          <p className="text-4xl font-black mt-2 tracking-tighter text-orange-600">
            {totals.captionsRated.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Avg Vote (if available)
          </p>
          <p className="text-4xl font-black mt-2 tracking-tighter text-emerald-600">
            {totals.avgVote === null ? '—' : totals.avgVote.toFixed(2)}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 h-[350px] flex flex-col">
          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-6">
            Votes per day (last 30 days)
          </h4>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailySeries} margin={{ top: 10, right: 20, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 800, fill: '#cbd5e1' }}
                  padding={{ left: 10, right: 10 }}
                />
                <YAxis hide domain={[0, (max: number) => Math.max(max, 5)]} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    fontWeight: 900,
                    fontSize: '10px',
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={18} fill="#db2777" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200">
          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-6">
            Most rated captions (all-time)
          </h4>
          <div className="space-y-3">
            {hydratedTopCaptions.length === 0 ? (
              <div className="text-xs font-black uppercase tracking-[0.25em] text-slate-300 py-10 text-center">
                No data
              </div>
            ) : (
              hydratedTopCaptions.map((c) => (
                <div
                  key={c.captionId}
                  className="flex items-start justify-between gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50"
                >
                  <div className="min-w-0">
                    <div className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">
                      Caption ID
                    </div>
                    <div className="text-[10px] font-mono text-slate-600 break-all">
                      {c.captionId}
                    </div>
                    {c.content ? (
                      <div className="mt-2 text-[11px] font-bold text-slate-800">
                        “{c.content}”
                      </div>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">
                      Votes
                    </div>
                    <div className="text-lg font-black text-slate-900">{c.count}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}


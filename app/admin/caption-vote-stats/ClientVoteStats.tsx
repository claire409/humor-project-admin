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
type CaptionScoreRow = { id: string; display_text: string | null; total_votes: number };
type RankedCaption = {
  captionId: string;
  up: number;
  down: number;
  total: number;
  net: number;
  content?: string | null;
};

export default function ClientVoteStats({
  totals,
  dailySeries,
  mostVoted,
  bestNet,
  mostControversial,
  minVotesForRankings,
  topCaptionScores,
  captionsById,
}: {
  totals: {
    totalVotes: number;
    uniqueRaters: number;
    captionScoreRows: number | null;
  };
  dailySeries: DailyPoint[];
  mostVoted: RankedCaption[];
  bestNet: RankedCaption[];
  mostControversial: RankedCaption[];
  minVotesForRankings: number;
  topCaptionScores: CaptionScoreRow[];
  captionsById: Record<string, { content?: string | null }>;
}) {
  const hydrate = (items: RankedCaption[]) =>
    items.map((c) => ({
      ...c,
      content: c.content ?? captionsById[c.captionId]?.content ?? null,
    }));

  const hydratedMostVoted = hydrate(mostVoted);
  const hydratedBestNet = hydrate(bestNet);
  const hydratedMostControversial = hydrate(mostControversial);

  const fmtPct = (n: number) => `${Math.round(n * 1000) / 10}%`;

  const Row = ({ item }: { item: RankedCaption }) => {
    const upRate = item.total ? item.up / item.total : 0;
    return (
      <div className="flex items-start justify-between gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50">
        <div className="min-w-0">
          <div className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">
            Caption ID
          </div>
          <div className="text-[10px] font-mono text-slate-600 break-all">{item.captionId}</div>
          {item.content ? (
            <div className="mt-2 text-[11px] font-bold text-slate-800">“{item.content}”</div>
          ) : null}
        </div>
        <div className="shrink-0 text-right space-y-1">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">
              Votes
            </div>
            <div className="text-lg font-black text-slate-900">{item.total}</div>
          </div>
          <div className="text-[10px] font-mono text-slate-600">
            {item.up}↑ {item.down}↓ · {fmtPct(upRate)} up
          </div>
          <div className="text-[10px] font-mono text-slate-600">
            Net:{' '}
            <span className={item.net >= 0 ? 'text-emerald-700' : 'text-red-700'}>
              {item.net}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10">
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          <p className="mt-2 text-[10px] font-mono text-slate-500">
            Distinct non-null <span className="font-mono">profile_id</span> across all vote rows.
          </p>
        </div>
      </section>

      <section className="space-y-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 h-[350px] flex flex-col">
          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-6">
            Votes per day (last 30 days)
          </h4>
          <div className="w-full" style={{ height: 280 }}>
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
                <YAxis hide domain={[0, 'auto']} />
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
          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">
            Most voted captions (all-time)
          </h4>
          <p className="text-[10px] font-mono text-slate-500 mb-6">(Ranked by total votes)</p>
          <div className="space-y-3">
            {hydratedMostVoted.length === 0 ? (
              <div className="text-xs font-black uppercase tracking-[0.25em] text-slate-300 py-10 text-center">
                No data
              </div>
            ) : (
              hydratedMostVoted.map((item) => <Row key={item.captionId} item={item} />)
            )}
          </div>
        </div>
      </section>

      <section>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200">
          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">
            Top captions by total_votes (caption_scores)
          </h4>
          <p className="text-[10px] font-mono text-slate-500 mb-6">
            {totals.captionScoreRows === null
              ? '(All-time; score rows unknown)'
              : `(All-time; ${totals.captionScoreRows.toLocaleString()} score rows)`}
          </p>
          <div className="space-y-3">
            {topCaptionScores.length === 0 ? (
              <div className="text-xs font-black uppercase tracking-[0.25em] text-slate-300 py-10 text-center">
                No data
              </div>
            ) : (
              topCaptionScores.map((r) => (
                <div
                  key={r.id}
                  className="flex items-start justify-between gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50"
                >
                  <div className="min-w-0">
                    <div className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">
                      Caption
                    </div>
                    <div className="mt-1 text-[11px] font-bold text-slate-800">
                      {r.display_text ? `“${r.display_text}”` : '—'}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">
                      Total Votes
                    </div>
                    <div className="text-lg font-black text-slate-900">
                      {r.total_votes.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200">
          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">
            Best net score (all-time)
          </h4>
          <p className="text-[10px] font-mono text-slate-500 mb-6">
            (Min {minVotesForRankings} votes; ranked by net = up − down)
          </p>
          <div className="space-y-3">
            {hydratedBestNet.length === 0 ? (
              <div className="text-xs font-black uppercase tracking-[0.25em] text-slate-300 py-10 text-center">
                No data
              </div>
            ) : (
              hydratedBestNet.map((item) => <Row key={item.captionId} item={item} />)
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200">
          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">
            Most controversial (all-time)
          </h4>
          <p className="text-[10px] font-mono text-slate-500 mb-6">
            (Min {minVotesForRankings} votes; closest to 50/50 up vs down)
          </p>
          <div className="space-y-3">
            {hydratedMostControversial.length === 0 ? (
              <div className="text-xs font-black uppercase tracking-[0.25em] text-slate-300 py-10 text-center">
                No data
              </div>
            ) : (
              hydratedMostControversial.map((item) => <Row key={item.captionId} item={item} />)
            )}
          </div>
        </div>
      </section>
    </div>
  );
}


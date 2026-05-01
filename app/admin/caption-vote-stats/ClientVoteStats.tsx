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

function pickCreatedAtKey(rows: AnyRow[]): string | null {
  if (!rows.length) return null;
  const candidates = ['created_datetime_utc', 'created_at', 'createdAt', 'inserted_at'];
  for (const k of candidates) if (k in rows[0]) return k;
  return null;
}

function pickCaptionIdKey(rows: AnyRow[]): string | null {
  if (!rows.length) return null;
  const candidates = ['caption_id', 'captionId'];
  for (const k of candidates) if (k in rows[0]) return k;
  return null;
}

function pickRaterKey(rows: AnyRow[]): string | null {
  if (!rows.length) return null;
  const candidates = ['profile_id', 'user_id', 'rater_profile_id', 'rater_user_id'];
  for (const k of candidates) if (k in rows[0]) return k;
  return null;
}

function extractVoteNumeric(voteRow: AnyRow): number | null {
  const candidates = ['vote', 'value', 'rating', 'score', 'vote_value'];
  for (const k of candidates) {
    if (k in voteRow) {
      const n = Number(voteRow[k]);
      if (!Number.isNaN(n)) return n;
    }
  }

  // Common boolean shapes
  if (typeof voteRow.is_upvote === 'boolean') return voteRow.is_upvote ? 1 : -1;
  if (typeof voteRow.is_upvote === 'string') {
    if (voteRow.is_upvote === 'true') return 1;
    if (voteRow.is_upvote === 'false') return -1;
  }

  // Common direction shapes
  if (typeof voteRow.direction === 'string') {
    const d = voteRow.direction.toLowerCase();
    if (d === 'up' || d === 'upvote' || d === 'like') return 1;
    if (d === 'down' || d === 'downvote' || d === 'dislike') return -1;
  }

  return null;
}

function dayKey(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function ClientVoteStats({
  votes,
  captionsById,
}: {
  votes: AnyRow[];
  captionsById: Record<string, { content?: string | null }>;
}) {
  const createdAtKey = pickCreatedAtKey(votes);
  const captionIdKey = pickCaptionIdKey(votes);
  const raterKey = pickRaterKey(votes);

  const uniqueRaters = new Set<string>();
  const uniqueCaptions = new Set<string>();
  let voteNumericSum = 0;
  let voteNumericCount = 0;

  const perDay: Record<string, number> = {};
  const perCaption: Record<string, number> = {};

  for (const v of votes) {
    const captionId = captionIdKey ? v[captionIdKey] : null;
    if (captionId !== null && captionId !== undefined && captionId !== '') {
      const key = String(captionId);
      uniqueCaptions.add(key);
      perCaption[key] = (perCaption[key] ?? 0) + 1;
    }

    const rater = raterKey ? v[raterKey] : null;
    if (rater !== null && rater !== undefined && rater !== '') uniqueRaters.add(String(rater));

    const voteN = extractVoteNumeric(v);
    if (voteN !== null) {
      voteNumericSum += voteN;
      voteNumericCount += 1;
    }

    const createdRaw = createdAtKey ? v[createdAtKey] : null;
    if (createdRaw) {
      const d = new Date(createdRaw);
      if (!Number.isNaN(d.getTime())) {
        const k = dayKey(d);
        perDay[k] = (perDay[k] ?? 0) + 1;
      }
    }
  }

  // last 30 days buckets
  const now = new Date();
  const dailySeries = Array.from({ length: 30 }).map((_, idx) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (29 - idx));
    const k = dayKey(d);
    return { day: k.slice(5), count: perDay[k] ?? 0 };
  });

  const topCaptions = Object.entries(perCaption)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([captionId, count]) => ({
      captionId,
      count,
      content: captionsById[captionId]?.content ?? null,
    }));

  const avgVote = voteNumericCount ? voteNumericSum / voteNumericCount : null;

  return (
    <div className="space-y-10">
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Votes (sample)
          </p>
          <p className="text-4xl font-black mt-2 tracking-tighter text-pink-600">
            {votes.length.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Unique Raters (sample)
          </p>
          <p className="text-4xl font-black mt-2 tracking-tighter text-blue-600">
            {uniqueRaters.size.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Captions Rated (sample)
          </p>
          <p className="text-4xl font-black mt-2 tracking-tighter text-orange-600">
            {uniqueCaptions.size.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Avg Vote (if available)
          </p>
          <p className="text-4xl font-black mt-2 tracking-tighter text-emerald-600">
            {avgVote === null ? '—' : avgVote.toFixed(2)}
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
            Most rated captions (sample)
          </h4>
          <div className="space-y-3">
            {topCaptions.length === 0 ? (
              <div className="text-xs font-black uppercase tracking-[0.25em] text-slate-300 py-10 text-center">
                No data
              </div>
            ) : (
              topCaptions.map((c) => (
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


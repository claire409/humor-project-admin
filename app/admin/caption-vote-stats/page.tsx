export const dynamic = 'force-dynamic';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import ClientVoteStats from './ClientVoteStats';

type AnyRow = { [key: string]: any };

function pickCreatedAtKey(rows: AnyRow[]): string | null {
  if (!rows.length) return null;
  const candidates = ['created_datetime_utc', 'created_at', 'createdAt', 'inserted_at'];
  for (const k of candidates) if (k in rows[0]) return k;
  return null;
}

function dayKey(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function extractVoteNumeric(voteRow: AnyRow): number | null {
  const candidates = ['vote', 'value', 'rating', 'score', 'vote_value'];
  for (const k of candidates) {
    if (k in voteRow) {
      const n = Number(voteRow[k]);
      if (!Number.isNaN(n)) return n;
    }
  }

  if (typeof voteRow.is_upvote === 'boolean') return voteRow.is_upvote ? 1 : -1;
  if (typeof voteRow.is_upvote === 'string') {
    if (voteRow.is_upvote === 'true') return 1;
    if (voteRow.is_upvote === 'false') return -1;
  }

  if (typeof voteRow.direction === 'string') {
    const d = voteRow.direction.toLowerCase();
    if (d === 'up' || d === 'upvote' || d === 'like') return 1;
    if (d === 'down' || d === 'downvote' || d === 'dislike') return -1;
  }

  return null;
}

export default async function CaptionVoteStatsPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  // Figure out which columns exist with a cheap probe.
  const { data: probe, error: probeError } = await supabase
    .from('caption_votes')
    .select('*')
    .limit(1);

  if (probeError) {
    return (
      <div className="p-8 text-center text-sm text-red-600 font-mono">
        {probeError.message}
      </div>
    );
  }

  const probeRow = ((probe ?? [])[0] ?? null) as AnyRow | null;
  const availableCols = probeRow ? Object.keys(probeRow) : [];

  const createdAtKey = pickCreatedAtKey(probeRow ? [probeRow] : []);
  const captionIdKey = availableCols.includes('caption_id') ? 'caption_id' : null;
  const raterKey =
    availableCols.includes('profile_id')
      ? 'profile_id'
      : availableCols.includes('user_id')
        ? 'user_id'
        : null;

  const selectCols = Array.from(
    new Set(
      [
        createdAtKey,
        captionIdKey,
        raterKey,
        'vote',
        'value',
        'rating',
        'score',
        'vote_value',
        'is_upvote',
        'direction',
      ].filter(Boolean) as string[]
    )
  );

  const orderKey = createdAtKey ?? 'created_datetime_utc';
  const perCaption = new Map<string, number>();
  const uniqueRaters = new Set<string>();
  const uniqueCaptions = new Set<string>();
  let voteNumericSum = 0;
  let voteNumericCount = 0;

  // Only keep per-day buckets for last 30 days to keep memory bounded.
  const now = new Date();
  const start30 = new Date(now);
  start30.setDate(start30.getDate() - 29);
  start30.setHours(0, 0, 0, 0);
  const perDay30: Record<string, number> = {};

  let offset = 0;
  const pageSize = 10000;

  while (true) {
    const { data: page, error: pageError } = await supabase
      .from('caption_votes')
      .select(selectCols.join(','))
      .order(orderKey, { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (pageError) {
      return (
        <div className="p-8 text-center text-sm text-red-600 font-mono">
          {pageError.message}
        </div>
      );
    }

    const rows = (page ?? []) as AnyRow[];
    if (!rows.length) break;

    for (const v of rows) {
      if (captionIdKey && v[captionIdKey] !== null && v[captionIdKey] !== undefined && v[captionIdKey] !== '') {
        const cid = String(v[captionIdKey]);
        uniqueCaptions.add(cid);
        perCaption.set(cid, (perCaption.get(cid) ?? 0) + 1);
      }

      if (raterKey && v[raterKey] !== null && v[raterKey] !== undefined && v[raterKey] !== '') {
        uniqueRaters.add(String(v[raterKey]));
      }

      const voteN = extractVoteNumeric(v);
      if (voteN !== null) {
        voteNumericSum += voteN;
        voteNumericCount += 1;
      }

      if (createdAtKey && v[createdAtKey]) {
        const d = new Date(v[createdAtKey]);
        if (!Number.isNaN(d.getTime()) && d >= start30) {
          const k = dayKey(d);
          perDay30[k] = (perDay30[k] ?? 0) + 1;
        }
      }
    }

    offset += rows.length;
    if (rows.length < pageSize) break;
  }

  const { count: totalVotes, error: countError } = await supabase
    .from('caption_votes')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    return (
      <div className="p-8 text-center text-sm text-red-600 font-mono">
        {countError.message}
      </div>
    );
  }

  const dailySeries = Array.from({ length: 30 }).map((_, idx) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (29 - idx));
    const k = dayKey(d);
    return { day: k.slice(5), count: perDay30[k] ?? 0 };
  });

  const topCaptionIds = Array.from(perCaption.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([captionId, count]) => ({ captionId, count }));

  const captionsById: Record<string, { content?: string | null }> = {};
  if (topCaptionIds.length) {
    const { data: captionsData } = await supabase
      .from('captions')
      .select('id,content')
      .in('id', topCaptionIds.map((x) => x.captionId));

    for (const c of (captionsData ?? []) as AnyRow[]) {
      captionsById[String(c.id)] = { content: c.content ?? null };
    }
  }

  const avgVote = voteNumericCount ? voteNumericSum / voteNumericCount : null;

  return (
    <div className="space-y-10 p-4">
      <div className="space-y-2">
        <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">
          Caption Rating Stats
        </h2>
        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.25em]">
          All-time (computed server-side)
        </p>
      </div>

      <ClientVoteStats
        totals={{
          totalVotes: totalVotes ?? offset,
          uniqueRaters: uniqueRaters.size,
          captionsRated: uniqueCaptions.size,
          avgVote,
        }}
        dailySeries={dailySeries}
        topCaptions={topCaptionIds.map((x) => ({
          ...x,
          content: captionsById[x.captionId]?.content ?? null,
        }))}
        captionsById={captionsById}
      />
    </div>
  );
}


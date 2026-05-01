export const dynamic = 'force-dynamic';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import ClientVoteStats from './ClientVoteStats';

type AnyRow = { [key: string]: any };

function dayKey(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

type CaptionAgg = { up: number; down: number; total: number; net: number };

export default async function CaptionVoteStatsPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  // All-time scan (paged) with known schema columns.
  const selectCols = 'created_datetime_utc,vote_value,profile_id,caption_id,is_from_study';

  const perCaption = new Map<string, CaptionAgg>();
  const uniqueRaters = new Set<string>();
  const uniqueCaptions = new Set<string>();
  let upvotes = 0;
  let downvotes = 0;
  let studyVotes = 0;

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
      .select(selectCols)
      .order('created_datetime_utc', { ascending: true })
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
      if (v.caption_id !== null && v.caption_id !== undefined && v.caption_id !== '') {
        const cid = String(v.caption_id);
        uniqueCaptions.add(cid);
        const agg = perCaption.get(cid) ?? { up: 0, down: 0, total: 0, net: 0 };
        const vv = Number(v.vote_value);
        if (vv === 1) {
          agg.up += 1;
          upvotes += 1;
        } else if (vv === -1) {
          agg.down += 1;
          downvotes += 1;
        }
        agg.total += 1;
        agg.net += vv === 1 ? 1 : vv === -1 ? -1 : 0;
        perCaption.set(cid, agg);
      }

      if (v.profile_id !== null && v.profile_id !== undefined && v.profile_id !== '') {
        uniqueRaters.add(String(v.profile_id));
      }

      if (v.is_from_study === true) studyVotes += 1;

      if (v.created_datetime_utc) {
        const d = new Date(v.created_datetime_utc);
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

  const minVotes = 15;
  const byMostVotes = Array.from(perCaption.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 15)
    .map(([captionId, agg]) => ({ captionId, ...agg }));

  const byBestNet = Array.from(perCaption.entries())
    .filter(([, agg]) => agg.total >= minVotes)
    .sort((a, b) => b[1].net - a[1].net)
    .slice(0, 15)
    .map(([captionId, agg]) => ({ captionId, ...agg }));

  const byMostControversial = Array.from(perCaption.entries())
    .filter(([, agg]) => agg.total >= minVotes)
    .sort((a, b) => {
      const aUpRate = a[1].up / a[1].total;
      const bUpRate = b[1].up / b[1].total;
      const aDelta = Math.abs(aUpRate - 0.5);
      const bDelta = Math.abs(bUpRate - 0.5);
      if (aDelta !== bDelta) return aDelta - bDelta; // closer to 50/50 first
      return b[1].total - a[1].total; // break ties by volume
    })
    .slice(0, 15)
    .map(([captionId, agg]) => ({ captionId, ...agg }));

  const captionsById: Record<string, { content?: string | null }> = {};
  const captionIdsToHydrate = Array.from(
    new Set([
      ...byMostVotes.map((x) => x.captionId),
      ...byBestNet.map((x) => x.captionId),
      ...byMostControversial.map((x) => x.captionId),
    ])
  );

  if (captionIdsToHydrate.length) {
    const { data: captionsData } = await supabase
      .from('captions')
      .select('id,content')
      .in('id', captionIdsToHydrate);

    for (const c of (captionsData ?? []) as AnyRow[]) {
      captionsById[String(c.id)] = { content: c.content ?? null };
    }
  }

  const totalVotesAll = totalVotes ?? offset;
  const upvoteRate = totalVotesAll ? upvotes / totalVotesAll : 0;
  const studyRate = totalVotesAll ? studyVotes / totalVotesAll : 0;

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
          totalVotes: totalVotesAll,
          uniqueRaters: uniqueRaters.size,
          captionsRated: uniqueCaptions.size,
          upvotes,
          downvotes,
          upvoteRate,
          studyVotes,
          studyRate,
        }}
        dailySeries={dailySeries}
        mostVoted={byMostVotes.map((x) => ({ ...x, content: captionsById[x.captionId]?.content ?? null }))}
        bestNet={byBestNet.map((x) => ({ ...x, content: captionsById[x.captionId]?.content ?? null }))}
        mostControversial={byMostControversial.map((x) => ({ ...x, content: captionsById[x.captionId]?.content ?? null }))}
        minVotesForRankings={minVotes}
        captionsById={captionsById}
      />
    </div>
  );
}


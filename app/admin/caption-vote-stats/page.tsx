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

export default async function CaptionVoteStatsPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  // Keep payload sizes bounded; this is “recent stats” not full history.
  const { data: votes, error } = await supabase
    .from('caption_votes')
    .select('*')
    .order('created_datetime_utc', { ascending: false })
    .range(0, 4999);

  if (error) {
    return (
      <div className="p-8 text-center text-sm text-red-600 font-mono">
        {error.message}
      </div>
    );
  }

  const voteRows = (votes ?? []) as AnyRow[];
  const createdAtKey = pickCreatedAtKey(voteRows);
  const sampleWindow = createdAtKey ? `${createdAtKey} (recent 5,000)` : 'recent 5,000';

  const captionIds = Array.from(
    new Set(
      voteRows
        .map((v) => v.caption_id)
        .filter((x) => x !== null && x !== undefined && x !== '')
        .map((x) => String(x))
    )
  ).slice(0, 2000);

  const captionsById: Record<string, { content?: string | null }> = {};
  if (captionIds.length) {
    const { data: captionsData } = await supabase
      .from('captions')
      .select('id,content')
      .in('id', captionIds);

    for (const c of (captionsData ?? []) as AnyRow[]) {
      captionsById[String(c.id)] = { content: c.content ?? null };
    }
  }

  return (
    <div className="space-y-10 p-4">
      <div className="space-y-2">
        <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">
          Caption Rating Stats
        </h2>
        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.25em]">
          Based on {sampleWindow}
        </p>
      </div>

      <ClientVoteStats votes={voteRows} captionsById={captionsById} />
    </div>
  );
}


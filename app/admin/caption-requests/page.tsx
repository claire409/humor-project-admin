'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

type AnyRow = { [key: string]: any };

export default function CaptionRequestsPage() {
  const [rows, setRows] = useState<AnyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchRows() {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('caption_requests')
      .select('*')
      .order('created_datetime_utc', { ascending: false });

    if (error) {
      setError(error.message);
    } else if (data) {
      setRows(data);
    }

    setLoading(false);
  }

  const columns = Array.from(
    rows.reduce<Set<string>>((set, row) => {
      Object.keys(row).forEach((k) => set.add(k));
      return set;
    }, new Set<string>())
  );

  return (
    <div className="space-y-8 p-4">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">
            Caption Requests
          </h2>
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.25em] mt-2">
            Read-only view of caption generation requests
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-16 text-center text-xs font-black uppercase tracking-[0.35em] text-slate-300 animate-pulse">
            Loading Requests...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-red-600 font-mono">
            {error}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-16 text-center text-xs font-black uppercase tracking-[0.35em] text-slate-300">
            No caption requests found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 border-b border-slate-200">
                <tr>
                  {columns.map((col) => (
                    <th key={col} className="px-4 py-3 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr
                    key={row.id ?? JSON.stringify(row)}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    {columns.map((col) => (
                      <td
                        key={col}
                        className="px-4 py-3 align-top text-[11px] text-slate-700 max-w-xs"
                      >
                        <span className="font-mono text-[10px] text-slate-400 block mb-1">
                          {col}
                        </span>
                        <span className="break-words">
                          {typeof row[col] === 'object' && row[col] !== null
                            ? JSON.stringify(row[col])
                            : String(row[col] ?? '—')}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


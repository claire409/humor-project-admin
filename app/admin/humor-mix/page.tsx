'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

type AnyRow = { [key: string]: any };

export default function HumorMixPage() {
  const [rows, setRows] = useState<AnyRow[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBuffer, setEditBuffer] = useState<AnyRow>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
      .from('humor_flavor_mix')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      setError(error.message);
    } else if (data) {
      setRows(data);
    }
    setLoading(false);
  }

  function startEdit(row: AnyRow) {
    setEditingId(row.id);
    setEditBuffer(row);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditBuffer({});
  }

  async function saveEdit(id: string) {
    setSaving(true);
    setError(null);
    const payload = { ...editBuffer };
    delete (payload as any).id;

    const { error } = await supabase
      .from('humor_mix')
      .update(payload)
      .eq('id', id);

    if (error) {
      setError(error.message);
    } else {
      setEditingId(null);
      await fetchRows();
    }
    setSaving(false);
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
            Humor Mix
          </h2>
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.25em] mt-2">
            Read and update humor mix configuration
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-16 text-center text-xs font-black uppercase tracking-[0.35em] text-slate-300 animate-pulse">
            Loading Mix...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-red-600 font-mono">
            {error}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-16 text-center text-xs font-black uppercase tracking-[0.35em] text-slate-300">
            No mix rows found
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
                  <th className="px-4 py-3 whitespace-nowrap" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => {
                  const isEditing = editingId === row.id;
                  const current = isEditing ? editBuffer : row;

                  return (
                    <tr
                      key={row.id ?? JSON.stringify(row)}
                      className={isEditing ? 'bg-blue-50/40' : 'hover:bg-slate-50 transition-colors'}
                    >
                      {columns.map((col) => (
                        <td
                          key={col}
                          className="px-4 py-3 align-top text-[11px] text-slate-700 max-w-xs"
                        >
                          <span className="font-mono text-[10px] text-slate-400 block mb-1">
                            {col}
                          </span>
                          {isEditing && col !== 'id' ? (
                            <input
                              className="w-full border border-slate-200 rounded-lg px-2 py-1 text-[11px] bg-white"
                              value={
                                typeof current[col] === 'object' && current[col] !== null
                                  ? JSON.stringify(current[col])
                                  : current[col] ?? ''
                              }
                              onChange={(e) => {
                                let value: any = e.target.value;
                                // Light attempt: keep JSON-ish fields as raw strings; user can manage type
                                (setEditBuffer as any)((prev: AnyRow) => ({
                                  ...prev,
                                  [col]: value,
                                }));
                              }}
                            />
                          ) : (
                            <span className="break-words">
                              {typeof current[col] === 'object' && current[col] !== null
                                ? JSON.stringify(current[col])
                                : String(current[col] ?? '—')}
                            </span>
                          )}
                        </td>
                      ))}
                      <td className="px-4 py-3 align-top">
                        {isEditing ? (
                          <div className="flex gap-2">
                            <button
                              disabled={saving}
                              onClick={() => saveEdit(row.id)}
                              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.15em]"
                            >
                              {saving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="text-slate-400 hover:text-slate-700 text-[9px] font-black uppercase tracking-[0.15em]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(row)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.15em]"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


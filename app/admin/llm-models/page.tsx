'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

type AnyRow = { [key: string]: any };

export default function LlmModelsPage() {
  const [rows, setRows] = useState<AnyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBuffer, setEditBuffer] = useState<AnyRow>({});
  const [newRow, setNewRow] = useState<AnyRow>({});
  const [saving, setSaving] = useState(false);

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
      .from('llm_models')
      .select('*')
      .order('id', { ascending: true });

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

  const effectiveColumns = columns.length ? columns : ['id', 'provider_id', 'name'];

  function startEdit(row: AnyRow) {
    setEditingId(row.id);
    setEditBuffer(row);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditBuffer({});
  }

  async function handleUpdate(id: string) {
    setSaving(true);
    setError(null);
    const payload = { ...editBuffer };
    delete (payload as any).id;

    const { error } = await supabase
      .from('llm_models')
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

  async function handleCreate() {
    setSaving(true);
    setError(null);

    const payload = { ...newRow };
    delete (payload as any).id;

    const { error } = await supabase
      .from('llm_models')
      .insert([payload]);
    if (error) {
      setError(error.message);
    } else {
      setNewRow({});
      await fetchRows();
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this LLM model?')) return;
    setSaving(true);
    setError(null);
    const { error } = await supabase
      .from('llm_models')
      .delete()
      .eq('id', id);
    if (error) {
      setError(error.message);
    } else {
      await fetchRows();
    }
    setSaving(false);
  }

  return (
    <div className="space-y-8 p-4">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">
            LLM Models
          </h2>
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.25em] mt-2">
            Manage available LLM models
          </p>
        </div>
      </div>

      {/* Create New */}
      <div className="bg-white rounded-[2rem] border border-dashed border-slate-300 p-6 space-y-4">
        <h3 className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">
          Create New LLM Model
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {effectiveColumns.map((col) => (
            <div key={col} className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">
                {col}
              </label>
              <input
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[11px]"
                value={newRow[col] ?? ''}
                onChange={(e) =>
                  setNewRow((prev: AnyRow) => ({
                    ...prev,
                    [col]: e.target.value,
                  }))
                }
              />
            </div>
          ))}
        </div>
        <button
          disabled={saving}
          onClick={handleCreate}
          className="mt-2 bg-slate-900 hover:bg-black disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-[0.25em] px-6 py-3 rounded-xl"
        >
          {saving ? 'Saving...' : 'Create LLM Model'}
        </button>
      </div>

      {/* Existing Rows */}
      <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-16 text-center text-xs font-black uppercase tracking-[0.35em] text-slate-300 animate-pulse">
            Loading LLM Models...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-red-600 font-mono">
            {error}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-16 text-center text-xs font-black uppercase tracking-[0.35em] text-slate-300">
            No LLM models found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 border-b border-slate-200">
                <tr>
                  {effectiveColumns.map((col) => (
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
                      {effectiveColumns.map((col) => (
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
                              value={current[col] ?? ''}
                              onChange={(e) =>
                                setEditBuffer((prev: AnyRow) => ({
                                  ...prev,
                                  [col]: e.target.value,
                                }))
                              }
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
                        <div className="flex gap-2">
                          {isEditing ? (
                            <>
                              <button
                                disabled={saving}
                                onClick={() => handleUpdate(row.id)}
                                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.15em]"
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="text-slate-400 hover:text-slate-700 text-[9px] font-black uppercase tracking-[0.15em]"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(row)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.15em]"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(row.id)}
                                className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.15em]"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
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


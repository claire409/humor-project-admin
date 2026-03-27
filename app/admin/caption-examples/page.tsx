'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

type AnyRow = { [key: string]: any };

export default function CaptionExamplesPage() {
  const [rows, setRows] = useState<AnyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBuffer, setEditBuffer] = useState<AnyRow>({});
  const [newRow, setNewRow] = useState<AnyRow>({});
  const [inputText, setInputText] = useState('');
  const [finalSearch, setFinalSearch] = useState('');
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
      .from('caption_examples')
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

  const effectiveColumns = columns.length ? columns : ['id', 'label', 'content'];

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
      .from('caption_examples')
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

    const image_description = String(newRow.image_description ?? '').trim();
    const caption = String(newRow.caption ?? '').trim();
    const explanation = String(newRow.explanation ?? '').trim();
    const priorityRaw = newRow.priority;

    const priority =
      priorityRaw === '' || priorityRaw === undefined || priorityRaw === null
        ? null
        : Number(priorityRaw);

    if (!image_description || !caption || !explanation || priority === null || Number.isNaN(priority)) {
      setError('Please fill in image description, caption, explanation, and priority.');
      setSaving(false);
      return;
    }

    // Only allow user-provided fields; the database will auto-fill the rest.
    const payload: AnyRow = {
      image_description,
      caption,
      explanation,
      priority,
    };

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      setError('Not authenticated.');
      setSaving(false);
      return;
    }

    const nowIso = new Date().toISOString();
    // Auto-fill common metadata fields when they exist.
    if (columns.includes('created_by')) payload.created_by = user.id;
    if (columns.includes('updated_by')) payload.updated_by = user.id;
    if (columns.includes('created_at')) payload.created_at = nowIso;
    if (columns.includes('updated_at')) payload.updated_at = nowIso;

    const { error } = await supabase
      .from('caption_examples')
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
    if (!confirm('Delete this caption example?')) return;
    setSaving(true);
    setError(null);
    const { error } = await supabase
      .from('caption_examples')
      .delete()
      .eq('id', id);
    if (error) {
      setError(error.message);
    } else {
      await fetchRows();
    }
    setSaving(false);
  }

  const handleSearch = () => {
    setFinalSearch(inputText);
  };

  const handleClear = () => {
    setInputText('');
    setFinalSearch('');
  };

  const filteredRows = rows.filter((row) => {
    const search = finalSearch.trim().toLowerCase();
    if (!search) return true;
    return effectiveColumns.some((col) =>
      String(row[col] ?? '').toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-8 p-4">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">
            Caption Examples
          </h2>
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.25em] mt-2">
            Manage reusable caption examples
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-80">
            <input
              type="text"
              value={inputText}
              placeholder="Search caption examples..."
              className="w-full p-4 pl-12 border border-slate-200 rounded-2xl text-xs focus:ring-4 focus:ring-blue-50 outline-none transition-all"
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <span className="absolute left-4 top-4 opacity-30 text-lg">🔍</span>
          </div>

          <button
            onClick={handleSearch}
            className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase px-6 py-4 rounded-2xl transition-all shadow-md active:scale-95"
          >
            Search
          </button>

          <button
            onClick={handleClear}
            className="bg-slate-200 hover:bg-slate-300 text-slate-600 text-[10px] font-black uppercase px-6 py-4 rounded-2xl transition-all active:scale-95"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Create New */}
      <div className="bg-white rounded-[2rem] border border-dashed border-slate-300 p-6 space-y-4">
        <h3 className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">
          Create New Caption Example
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1 md:col-span-2">
            <label className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">
              Image Description
            </label>
            <input
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[11px] placeholder:text-slate-400"
              placeholder="e.g. A dog wearing sunglasses at the beach"
              value={newRow.image_description ?? ''}
              onChange={(e) => setNewRow((prev: AnyRow) => ({ ...prev, image_description: e.target.value }))}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">
              Priority
            </label>
            <input
              type="number"
              step={1}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[11px] placeholder:text-slate-400"
              placeholder="e.g. 1"
              value={newRow.priority ?? ''}
              onChange={(e) => setNewRow((prev: AnyRow) => ({ ...prev, priority: e.target.value }))}
            />
          </div>

          <div className="space-y-1 md:col-span-3">
            <label className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">Caption</label>
            <input
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[11px] placeholder:text-slate-400"
              placeholder='e.g. "When Monday hits different"'
              value={newRow.caption ?? ''}
              onChange={(e) => setNewRow((prev: AnyRow) => ({ ...prev, caption: e.target.value }))}
            />
          </div>

          <div className="space-y-1 md:col-span-3">
            <label className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">Explanation</label>
            <textarea
              rows={3}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[11px] bg-white placeholder:text-slate-400"
              placeholder="e.g. Short note on why this caption fits the image"
              value={newRow.explanation ?? ''}
              onChange={(e) => setNewRow((prev: AnyRow) => ({ ...prev, explanation: e.target.value }))}
            />
          </div>
        </div>
        <button
          disabled={saving}
          onClick={handleCreate}
          className="mt-2 bg-slate-900 hover:bg-black disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-[0.25em] px-6 py-3 rounded-xl"
        >
          {saving ? 'Saving...' : 'Create Caption Example'}
        </button>
      </div>

      {/* Existing Rows */}
      <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-16 text-center text-xs font-black uppercase tracking-[0.35em] text-slate-300 animate-pulse">
            Loading Caption Examples...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-red-600 font-mono">
            {error}
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-16 text-center text-xs font-black uppercase tracking-[0.35em] text-slate-300">
            No matching caption examples found
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
                {filteredRows.map((row) => {
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


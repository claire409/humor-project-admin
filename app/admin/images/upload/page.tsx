'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function UploadImagePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form State
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isCommonUse, setIsCommonUse] = useState(false);
  const [isPublic, setIsPublic] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const now = new Date().toISOString();

    const { error } = await supabase
      .from('images')
      .insert([
        {
          url: url,
          image_description: description,
          is_common_use: isCommonUse,
          is_public: isPublic,
          created_datetime_utc: now,
          modified_datetime_utc: now // On creation, both are the same
        }
      ]);

    if (!error) {
      router.push('/admin/images');
      router.refresh();
    } else {
      alert(`Error: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-10 rounded-3xl border border-slate-200 shadow-xl mt-10">
      <h2 className="text-2xl font-black uppercase mb-8 tracking-tighter">Add New Image</h2>

      <form onSubmit={handleCreate} className="space-y-6">
        {/* Image URL */}
        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Image Source URL</label>
          <input
            type="url" required
            placeholder="https://example.com/meme.png"
            className="w-full p-4 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Image Description (Alt Text)</label>
          <textarea
            placeholder="Describe the meme content..."
            className="w-full p-4 border border-slate-200 rounded-xl text-sm h-24 focus:ring-2 focus:ring-blue-500 outline-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Checkboxes */}
        <div className="flex flex-col gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              checked={isCommonUse}
              onChange={(e) => setIsCommonUse(e.target.checked)}
            />
            <span className="text-xs font-bold uppercase text-slate-600 group-hover:text-blue-600 transition-colors">
              Mark as Common Use
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            <span className="text-xs font-bold uppercase text-slate-600 group-hover:text-blue-600 transition-colors">
              Make Image Publicly Visible
            </span>
          </label>
        </div>

        <div className="pt-4 space-y-3">
          <button
            disabled={loading}
            className="w-full bg-blue-600 text-white font-black uppercase py-4 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-200"
          >
            {loading ? 'Processing...' : 'Create Image Record'}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="w-full text-slate-400 text-[10px] font-bold uppercase tracking-widest hover:text-slate-600 transition-colors"
          >
            Cancel and Go Back
          </button>
        </div>
      </form>
    </div>
  );
}
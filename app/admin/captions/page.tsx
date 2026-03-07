'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function CaptionsPage() {
  const [captions, setCaptions] = useState<any[]>([]);
  const [inputText, setInputText] = useState(''); // Current typing
  const [finalSearch, setFinalSearch] = useState(''); // Only updates on button click
  const [loading, setLoading] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    setHasMounted(true);
    fetchCaptions();
  }, []);

  async function fetchCaptions() {
    setLoading(true);
    const { data } = await supabase
      .from('captions')
      .select(`*, images (url)`)
      .order('created_datetime_utc', { ascending: false });

    if (data) setCaptions(data);
    setLoading(false);
  }

  // --- Search Actions ---
  const handleSearch = () => {
    setFinalSearch(inputText);
  };

  const handleClear = () => {
    setInputText('');
    setFinalSearch('');
  };

  // Filter logic now uses finalSearch
  const filteredCaptions = captions.filter((c) => {
    const search = finalSearch.toLowerCase();
    return (
      c.content?.toLowerCase().includes(search) ||
      c.profile_id?.toLowerCase().includes(search) ||
      c.image_id?.toLowerCase().includes(search)
    );
  });

  if (!hasMounted) return null;

  return (
    <div className="space-y-8 p-4">
      {/* Header & Search Bar with Buttons */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Caption Audit</h2>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-80">
            <input
              type="text"
              value={inputText}
              placeholder="Search content, profile, or image ID..."
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

      {/* Caption List */}
      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="p-20 text-center font-black uppercase text-slate-300 animate-pulse">Loading Logs...</div>
        ) : filteredCaptions.length > 0 ? (
          filteredCaptions.map((cap) => (
            <div key={cap.id} className="bg-white rounded-[2rem] border border-slate-200 p-8 flex flex-col xl:flex-row gap-8 hover:border-slate-300 transition-all shadow-sm">
              {/* Image Preview */}
              <div className="shrink-0 flex flex-col items-center gap-3">
                <div className="relative">
                  <img
                    src={cap.images?.url || 'https://via.placeholder.com/150?text=No+Image'}
                    className="w-40 h-40 object-cover rounded-3xl bg-slate-50 border shadow-inner"
                    alt="Source image"
                  />
                  {cap.is_public && (
                    <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase shadow-lg border-2 border-white">Public</span>
                  )}
                </div>
              </div>

              {/* Content & Metadata */}
              <div className="flex-1 space-y-6">
                <div>
                  <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Caption Text</h4>
                  <p className="text-xl font-bold text-slate-900 leading-tight">“{cap.content}”</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 pt-6 border-t border-slate-100">
                  <div>
                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Profile ID</h4>
                    <p className="text-[11px] font-mono text-slate-600 break-all bg-slate-50 p-2 rounded-lg">{cap.profile_id}</p>
                  </div>
                  <div>
                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Flavor ID</h4>
                    <p className="text-[11px] font-bold text-indigo-600 bg-indigo-50 p-2 rounded-lg inline-block min-w-[40px] text-center">{cap.humor_flavor_id}</p>
                  </div>
                  <div>
                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Likes</h4>
                    <p className="text-[11px] font-bold text-pink-600 bg-pink-50 p-2 rounded-lg inline-block min-w-[40px] text-center">❤️ {cap.like_count || 0}</p>
                  </div>
                  <div>
                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Created</h4>
                    <div className="text-[11px] font-bold text-slate-600 p-2">
                      {new Date(cap.created_datetime_utc).toLocaleDateString()}
                      <span className="block font-normal opacity-50">{new Date(cap.created_datetime_utc).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Image ID</h4>
                    <p className="text-[11px] font-mono text-slate-400 break-all bg-slate-50 p-2 rounded-lg">{cap.image_id}</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-20 text-center border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-300 font-black uppercase">
            No matching records found
          </div>
        )}
      </div>
    </div>
  );
}
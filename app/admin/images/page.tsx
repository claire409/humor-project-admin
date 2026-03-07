'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

export default function ImagesPage() {
  const [images, setImages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [finalSearch, setFinalSearch] = useState('');
  const [hasMounted, setHasMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [editForm, setEditForm] = useState({
    url: '',
    image_description: '',
    is_public: false,
    is_common_use: false
  });

  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    setHasMounted(true);
    fetchImages();
  }, []);

  async function fetchImages() {
    setLoading(true);
    const { data } = await supabase
      .from('images')
      .select('*')
      .order('created_datetime_utc', { ascending: false });
    if (data) setImages(data);
    setLoading(false);
  }

  const handleSearch = () => {
    setFinalSearch(inputText);
  };

  const handleClear = () => {
    setInputText('');
    setFinalSearch('');
  };

  const filteredImages = images.filter((img) => {
    const search = finalSearch.toLowerCase();
    return (
      img.url?.toLowerCase().includes(search) ||
      img.image_description?.toLowerCase().includes(search) ||
      img.profile_id?.toLowerCase().includes(search) ||
      img.user_id?.toLowerCase().includes(search)
    );
  });

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return (
      <>
        {d.toLocaleDateString()} <span className="font-normal opacity-50">{d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </>
    );
  };

  const startEditing = (img: any) => {
    setEditingId(img.id);
    setEditForm({
      url: img.url,
      image_description: img.image_description || '',
      is_public: img.is_public,
      is_common_use: img.is_common_use
    });
  };

  async function handleSaveUpdate(id: string) {
    const { error } = await supabase
      .from('images')
      .update({
        ...editForm,
        modified_datetime_utc: new Date().toISOString()
      })
      .eq('id', id);

    if (error) alert(error.message);
    else {
      setEditingId(null);
      fetchImages();
    }
  }

  if (!hasMounted) return null;

  return (
    <div className="space-y-8 p-4">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Images</h2>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-80">
            <input
              type="text"
              value={inputText}
              placeholder="Search URL, image description, or profile ID..."
              className="w-full p-4 pl-12 border border-slate-200 rounded-2xl text-xs focus:ring-4 focus:ring-blue-50 outline-none transition-all"
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <span className="absolute left-4 top-4 opacity-30 text-lg">🔍</span>
          </div>

          <button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase px-6 py-4 rounded-2xl transition-all shadow-md active:scale-95">
            Search
          </button>

          <button onClick={handleClear} className="bg-slate-200 hover:bg-slate-300 text-slate-600 text-[10px] font-black uppercase px-6 py-4 rounded-2xl transition-all active:scale-95">
            Clear
          </button>

          <button onClick={() => router.push('/admin/images/upload')} className="bg-slate-900 hover:bg-black text-white px-6 py-4 rounded-2xl font-black uppercase text-[10px] shadow-md transition-all active:scale-95 ml-2">
            + Add
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="p-20 text-center font-black uppercase text-slate-300 animate-pulse tracking-widest">
            Loading Logs...
          </div>
        ) : filteredImages.length > 0 ? (
          filteredImages.map((img) => (
            <div key={img.id} className={`bg-white rounded-[2rem] border transition-all ${editingId === img.id ? 'border-blue-500 ring-8 ring-blue-50' : 'border-slate-200 shadow-sm'}`}>
              <div className="p-8">
                {editingId === img.id ? (
                  /* --- EDIT MODE --- */
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-blue-600">Edit Image URL</label>
                        <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" value={editForm.url} onChange={e => setEditForm({...editForm, url: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-blue-600">Edit Description</label>
                        <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" value={editForm.image_description} onChange={e => setEditForm({...editForm, image_description: e.target.value})} />
                      </div>
                    </div>

                    {/* Checkboxes in Edit Mode */}
                    <div className="flex gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          checked={editForm.is_common_use}
                          onChange={(e) => setEditForm({...editForm, is_common_use: e.target.checked})}
                        />
                        <span className="text-[10px] font-black uppercase text-slate-600 group-hover:text-blue-600 transition-colors">Common Use</span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          checked={editForm.is_public}
                          onChange={(e) => setEditForm({...editForm, is_public: e.target.checked})}
                        />
                        <span className="text-[10px] font-black uppercase text-slate-600 group-hover:text-blue-600 transition-colors">Publicly Visible</span>
                      </label>
                    </div>

                    <div className="flex gap-4 pt-2 border-t border-slate-100">
                      <button onClick={() => handleSaveUpdate(img.id)} className="bg-blue-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase shadow-md active:scale-95 transition-all">Save Changes</button>
                      <button onClick={() => setEditingId(null)} className="text-slate-400 px-6 py-3 text-[10px] font-black uppercase hover:text-slate-600 transition-all">Cancel</button>
                    </div>
                  </div>
                ) : (
                  /* --- READ MODE --- */
                  <div className="flex flex-col lg:flex-row gap-8">
                    <div className="shrink-0 space-y-3">
                      <div className="relative">
                        <img src={img.url} className="w-40 h-40 object-cover rounded-3xl bg-slate-100 border shadow-inner" alt="" />
                        <div className="absolute -top-2 -right-2 flex flex-col gap-1">
                          {img.is_public && <span className="px-3 py-1 bg-green-500 text-white text-[8px] font-black rounded-full uppercase shadow-lg border-2 border-white text-center">Public</span>}
                          {img.is_common_use && <span className="px-3 py-1 bg-indigo-500 text-white text-[8px] font-black rounded-full uppercase shadow-lg border-2 border-white text-center">Common</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 grid grid-cols-1 gap-y-6">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Image URL</h4>
                          <p className="text-xs font-bold text-blue-600 break-all">{img.url}</p>
                        </div>
                        <div>
                          <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Description</h4>
                          <p className="text-sm text-slate-700 font-medium leading-relaxed">{img.image_description || "—"}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                        <div>
                          <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Profile ID</h4>
                          <p className="text-[10px] font-mono text-slate-500 bg-slate-50 p-2 rounded-lg inline-block">{img.profile_id || img.user_id || "System"}</p>
                        </div>
                        <div className="flex gap-8">
                          <div>
                            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Created</h4>
                            <p className="text-[10px] font-bold text-slate-600">{formatDateTime(img.created_datetime_utc)}</p>
                          </div>
                          <div>
                            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Modified</h4>
                            <p className="text-[10px] font-bold text-slate-600">{formatDateTime(img.modified_datetime_utc)}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex lg:flex-col gap-2 justify-end">
                      <button onClick={() => startEditing(img)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all active:scale-95">Edit</button>
                      <button onClick={() => { if(confirm("Delete Image Asset?")) supabase.from('images').delete().eq('id', img.id).then(() => fetchImages()) }} className="bg-red-50 hover:bg-red-100 text-red-600 px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all active:scale-95">Delete</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-20 text-center border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-300 font-black uppercase">
            No image records found
          </div>
        )}
      </div>
    </div>
  );
}
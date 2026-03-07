'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function UsersPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [inputText, setInputText] = useState(''); // What the user is typing
  const [finalSearch, setFinalSearch] = useState(''); // What we are actually filtering by
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function fetchProfiles() {
      const { data } = await supabase.from('profiles').select('*');
      if (data) setProfiles(data);
      setLoading(false);
    }
    fetchProfiles();
  }, []);

  const handleSearch = () => {
    setFinalSearch(inputText);
  };

  const handleClear = () => {
    setInputText('');
    setFinalSearch('');
  };

  // Filter logic: Now uses finalSearch instead of inputText
  const filteredProfiles = profiles.filter((p) => {
    const fullName = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase();
    const search = finalSearch.toLowerCase();
    return (
      fullName.includes(search) ||
      p.email?.toLowerCase().includes(search) ||
      p.id?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-3xl font-black uppercase tracking-tighter">User Registry</h2>

        {/* Search Controls */}
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <input
              type="text"
              value={inputText}
              placeholder="Search name, email, or ID..."
              className="w-full p-3 pl-10 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <span className="absolute left-3 top-3.5 opacity-30">🔍</span>
          </div>

          <button
            onClick={handleSearch}
            className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase px-4 py-3 rounded-xl transition-all"
          >
            Search
          </button>

          <button
            onClick={handleClear}
            className="bg-slate-200 hover:bg-slate-300 text-slate-600 text-[10px] font-bold uppercase px-4 py-3 rounded-xl transition-all"
          >
            Clear
          </button>
        </div>
      </div>

      {/* ... Table code remains the same as previous step ... */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-200">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Profile ID</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={4} className="p-10 text-center text-slate-400 font-bold uppercase text-xs">Loading users...</td></tr>
            ) : filteredProfiles.length > 0 ? (
              filteredProfiles.map((p) => {
                const hasName = p.first_name || p.last_name;
                const displayName = hasName
                  ? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim()
                  : "Unnamed";

                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className={`p-4 font-bold ${!hasName ? 'text-slate-400 italic font-normal' : 'text-slate-900'}`}>
                      {displayName}
                    </td>
                    <td className="p-4 text-slate-500 font-mono text-xs">{p.email}</td>
                    <td className="p-4 text-slate-400 font-mono text-[10px]">{p.id}</td>
                    <td className="p-4">
                      {p.is_superadmin ? (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-[9px] font-black uppercase">Superadmin</span>
                      ) : (
                        <span className="bg-slate-100 text-slate-400 px-2 py-1 rounded text-[9px] font-black uppercase">User</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr><td colSpan={4} className="p-10 text-center text-slate-400 uppercase text-xs font-bold italic">No matching results found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
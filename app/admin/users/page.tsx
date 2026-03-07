'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function UsersPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [finalSearch, setFinalSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function fetchProfiles() {
      setLoading(true);
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
    <div className="space-y-6 p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Users</h2>

        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <input
              type="text"
              value={inputText}
              placeholder="Search name, email, or profile ID..."
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
              <tr>
                <td colSpan={4} className="p-20 text-center font-black uppercase text-slate-300 animate-pulse text-xs tracking-widest">
                  Loading Logs...
                </td>
              </tr>
            ) : filteredProfiles.length > 0 ? (
              filteredProfiles.map((p) => {
                const fullName = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim();
                const hasName = fullName.length > 0;
                const hasEmail = p.email && p.email.trim().length > 0;

                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className={`p-4 font-bold ${!hasName ? 'text-slate-300 italic font-normal' : 'text-slate-900'}`}>
                      {hasName ? fullName : "N/A"}
                    </td>
                    <td className={`p-4 font-mono text-xs ${!hasEmail ? 'text-slate-300 italic' : 'text-slate-500'}`}>
                      {hasEmail ? p.email : "N/A"}
                    </td>
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
              <tr>
                <td colSpan={4} className="p-20 text-center text-slate-400 uppercase text-xs font-bold italic">
                  No matching results found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
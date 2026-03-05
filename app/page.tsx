export default function Home() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-slate-900 text-white">
      <h1 className="text-5xl font-black tracking-tighter uppercase mb-4">Humor Project</h1>
      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-8">Internal Admin Console</p>
      
      <a href="/admin" className="bg-blue-600 hover:bg-blue-500 text-white font-black py-4 px-10 rounded-full transition-all">
        Enter Admin Area
      </a>
    </div>
  );
}
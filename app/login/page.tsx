export default function LoginPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-slate-900 text-white">
      <h1 className="text-5xl font-black tracking-tighter uppercase mb-2">
        Humor Project
      </h1>
      <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px] mb-12">
        Internal Admin Panel
      </p>

      <form action="/auth/login" method="POST" className="w-full max-w-xs">
        <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 px-10 rounded-2xl transition-all shadow-xl shadow-blue-900/20 active:scale-95 flex items-center justify-center gap-3">
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="text-xs uppercase tracking-widest">
            Sign in with Google
          </span>
        </button>
      </form>

      <p className="mt-12 text-[9px] text-slate-600 font-bold uppercase tracking-[0.4em]">
        Only Authorized Personnel (Super Admin) Allowed
      </p>
    </div>
  );
}

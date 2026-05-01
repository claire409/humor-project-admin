export const dynamic = 'force-dynamic';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import SignOutButton from './SignOutButton'; // Import the new client component

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_superadmin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_superadmin) {
    return (
      <div className="h-screen flex items-center justify-center bg-red-50">
        <div className="bg-white border border-red-100 rounded-3xl px-10 py-12 shadow-xl text-center space-y-6">
          <p className="text-red-600 font-black uppercase tracking-[0.35em] text-[11px]">
            Access Denied
          </p>
          <p className="text-slate-800 text-lg font-black uppercase tracking-tight">
            Superadmins Only
          </p>
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.25em]">
            Try signing in with a different Google account.
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-3 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.25em] hover:bg-black transition-all active:scale-95"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar Navigation */}
      <nav className="w-64 bg-slate-900 text-slate-300 p-6 flex flex-col shadow-xl">
        <h1 className="text-white text-xl font-black uppercase tracking-tighter px-3 mb-8">
          Admin Panel
        </h1>

        <ul className="space-y-1 text-[11px] font-black uppercase tracking-[0.15em] flex-1">
          <li>
            <Link href="/admin" className="block p-4 hover:bg-slate-800 hover:text-white rounded-xl transition-all">
              Dashboard
            </Link>
          </li>
          <li>
            <Link href="/admin/users" className="block p-4 hover:bg-slate-800 hover:text-white rounded-xl transition-all">
              Users
            </Link>
          </li>
          <li>
            <Link href="/admin/images" className="block p-4 hover:bg-slate-800 hover:text-white rounded-xl transition-all">
              Images
            </Link>
          </li>
          <li>
            <Link href="/admin/captions" className="block p-4 hover:bg-slate-800 hover:text-white rounded-xl transition-all">
              Captions
            </Link>
          </li>

          {/* Humor System */}
          <li className="mt-4 text-[10px] text-slate-500 tracking-[0.25em] px-3">
            HUMOR SYSTEM
          </li>
          <li>
            <Link href="/admin/humor-flavors" className="block p-4 hover:bg-slate-800 hover:text-white rounded-xl transition-all">
              Humor Flavors
            </Link>
          </li>
          <li>
            <Link href="/admin/humor-flavor-steps" className="block p-4 hover:bg-slate-800 hover:text-white rounded-xl transition-all">
              Flavor Steps
            </Link>
          </li>
          <li>
            <Link href="/admin/humor-mix" className="block p-4 hover:bg-slate-800 hover:text-white rounded-xl transition-all">
              Humor Mix
            </Link>
          </li>
          <li>
            <Link href="/admin/terms" className="block p-4 hover:bg-slate-800 hover:text-white rounded-xl transition-all">
              Terms
            </Link>
          </li>

          {/* Captions & Requests */}
          <li className="mt-4 text-[10px] text-slate-500 tracking-[0.25em] px-3">
            CAPTIONS
          </li>
          <li>
            <Link href="/admin/caption-requests" className="block p-4 hover:bg-slate-800 hover:text-white rounded-xl transition-all">
              Caption Requests
            </Link>
          </li>
          <li>
            <Link href="/admin/caption-examples" className="block p-4 hover:bg-slate-800 hover:text-white rounded-xl transition-all">
              Caption Examples
            </Link>
          </li>

          {/* LLM System */}
          <li className="mt-4 text-[10px] text-slate-500 tracking-[0.25em] px-3">
            LLM SYSTEM
          </li>
          <li>
            <Link href="/admin/llm-providers" className="block p-4 hover:bg-slate-800 hover:text-white rounded-xl transition-all">
              LLM Providers
            </Link>
          </li>
          <li>
            <Link href="/admin/llm-models" className="block p-4 hover:bg-slate-800 hover:text-white rounded-xl transition-all">
              LLM Models
            </Link>
          </li>
          <li>
            <Link href="/admin/llm-prompt-chains" className="block p-4 hover:bg-slate-800 hover:text-white rounded-xl transition-all">
              Prompt Chains
            </Link>
          </li>
          <li>
            <Link href="/admin/llm-responses" className="block p-4 hover:bg-slate-800 hover:text-white rounded-xl transition-all">
              LLM Responses
            </Link>
          </li>
          <li>
            <Link href="/admin/caption-vote-stats" className="block p-4 hover:bg-slate-800 hover:text-white rounded-xl transition-all">
              Caption Rating Stats
            </Link>
          </li>

          {/* Access Control */}
          <li className="mt-4 text-[10px] text-slate-500 tracking-[0.25em] px-3">
            ACCESS CONTROL
          </li>
          <li>
            <Link href="/admin/allowed-signup-domains" className="block p-4 hover:bg-slate-800 hover:text-white rounded-xl transition-all">
              Allowed Domains
            </Link>
          </li>
          <li>
            <Link href="/admin/whitelisted-emails" className="block p-4 hover:bg-slate-800 hover:text-white rounded-xl transition-all">
              Whitelisted Emails
            </Link>
          </li>
        </ul>

        {/* The Client Component is safe to use here */}
        <div className="pt-6 border-t border-slate-800">
           <SignOutButton />
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-10 overflow-y-auto h-screen">
        {children}
      </main>
    </div>
  );
}
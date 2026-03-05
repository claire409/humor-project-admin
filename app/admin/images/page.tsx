import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export default async function ManageImages() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role to bypass RLS for Admin
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (c) => {} } }
  );

  // READ: Fetch all images
  const { data: images } = await supabase.from('images').select('*').order('created_datetime_utc', { ascending: false });

  // DELETE: Server Action to remove image
  async function deleteImage(formData: FormData) {
    'use server';
    const id = formData.get('id');
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );
    await supabaseAdmin.from('images').delete().eq('id', id);
    revalidatePath('/admin/images');
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-black uppercase">Manage Images (CRUD)</h1>
      <div className="grid grid-cols-1 gap-4">
        {images?.map((img) => (
          <div key={img.id} className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
            <img src={img.url} className="w-20 h-20 object-cover rounded-lg" alt="Thumbnail" />
            <div className="flex-1 px-4 text-xs font-mono text-slate-400">{img.id}</div>

            {/* DELETE BUTTON */}
            <form action={deleteImage}>
              <input type="hidden" name="id" value={img.id} />
              <button className="bg-red-500 text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase hover:bg-red-600 transition-colors">
                Delete
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
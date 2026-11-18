// Supabase-тің тегін жобасы 7 күн бойы ешкім кірмесе «ұйықтап» қалады.
// Vercel күн сайын осы адресті шақырады (vercel.json → crons), база белсенді болып тұрады.

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export async function GET(request: Request) {
  void request.headers;
  if (!URL_ || !KEY) return Response.json({ ok: false, error: "Дерекқор бапталмаған." }, { status: 503 });
  try {
    const res = await fetch(`${URL_}/rest/v1/zk_rooms?select=id&limit=1`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
      cache: "no-store",
    });
    return Response.json({ ok: res.ok, status: res.status, at: new Date().toISOString() }, { status: res.ok ? 200 : 502 });
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 502 });
  }
}

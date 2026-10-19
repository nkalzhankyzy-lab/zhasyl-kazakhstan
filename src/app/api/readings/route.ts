// Датчиктен өлшем қабылдау. Құрылғы әр 1–5 минут сайын POST жібереді:
//   POST /api/readings
//   Authorization: Bearer <құрылғы токені>
//   { "co2": 812, "temperature": 22.4, "humidity": 41, "pm25": 6.1, "measuredAt": "2026-10-24T05:30:00Z" }
// Барлық өріс міндетті емес, бірақ кемінде біреуі болуы керек. measuredAt болмаса — сервер уақыты.
// Тексеру мен жазу Supabase-тегі zk_ingest_reading функциясында (токен хэші zk_devices кестесінде).

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const ERRORS: Record<string, [number, string]> = {
  "invalid token": [401, "Құрылғы токені жарамсыз."],
  "no values": [400, "Кемінде бір өлшем керек: co2, temperature, humidity немесе pm25."],
  "value out of range": [400, "Мән мүмкін аралықтан тыс."],
  "bad timestamp": [400, "measuredAt уақыты дұрыс емес."],
  "too frequent": [429, "Тым жиі: бір құрылғыдан минутына бір өлшем."],
};

const num = (v: unknown) => (v === undefined || v === null || v === "" ? null : Number.isFinite(Number(v)) ? Number(v) : NaN);

export async function POST(request: Request) {
  if (!URL_ || !KEY) return Response.json({ error: "Дерекқор бапталмаған." }, { status: 503 });
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ?? "";
  if (!token) return Response.json({ error: "Authorization: Bearer <токен> керек." }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "JSON пішімі дұрыс емес." }, { status: 400 });
  }
  const vals = {
    p_co2: num(body.co2 ?? body.co2Ppm),
    p_temperature: num(body.temperature ?? body.temperatureC),
    p_humidity: num(body.humidity ?? body.humidityPct),
    p_pm25: num(body.pm25 ?? body.pm25UgM3),
  };
  if (Object.values(vals).some((v) => Number.isNaN(v))) return Response.json({ error: "Мәндер сан болуы керек." }, { status: 400 });
  let measuredAt: string | null = null;
  if (body.measuredAt) {
    const d = new Date(String(body.measuredAt));
    if (Number.isNaN(d.getTime())) return Response.json({ error: "measuredAt уақыты дұрыс емес." }, { status: 400 });
    measuredAt = d.toISOString();
  }

  let res: Response;
  try {
    res = await fetch(`${URL_}/rest/v1/rpc/zk_ingest_reading`, {
      method: "POST",
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_token: token, ...vals, p_measured_at: measuredAt }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return Response.json({ error: "Дерекқорға қосылу мүмкін болмады." }, { status: 502 });
  }
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    const [status, text] = ERRORS[err.message ?? ""] ?? [502, "Өлшемді сақтау мүмкін болмады."];
    return Response.json({ error: text }, { status });
  }
  const id = (await res.json()) as string;
  return Response.json({ ok: true, id });
}

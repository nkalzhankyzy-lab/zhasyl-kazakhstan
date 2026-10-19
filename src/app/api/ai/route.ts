import { platformKnowledge } from "@/lib/ai/knowledge";

// Gemini кілті тек серверде: GEMINI_API_KEY (Vercel → Settings → Environment Variables).
const MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";
const API_BASE = process.env.GEMINI_API_BASE || "https://generativelanguage.googleapis.com/v1beta";

const MAX_MESSAGES = 12;
const MAX_CHARS = 2000;
const MAX_CONTEXT = 4000;

const SYSTEM = `Сен — «Жасыл Қазақстан» платформасының ЖИ экокеңесшісісің. Мектеп оқушылары мен мұғалімдерге биология, химия, экология, топырақ, өсімдік және кабинет ауасының сапасы бойынша көмектесесің.

Ережелер:
- Әрқашан қазақ тілінде, қарапайым әрі нақты жаз. Жауап қысқа болсын: 3–8 сөйлем немесе қысқа тізім.
- Алдымен төмендегі ПЛАТФОРМА ДЕРЕКТЕРІНЕ сүйен. Олардан тыс жалпы білім қолдансаң, мұны «жалпы білім бойынша» деп белгіле.
- Дерек пен болжамды ажырат. Білмесең, «нақты білмеймін» деп айт, ойдан сан немесе дереккөз құрастырма.
- Оқушының орнына қорытынды жасама: себептерді ұсын, бір-екі сұрақ қойып ойландыр, келесі өлшеу немесе тәжірибе қадамын ұсын.
- Математикалық сауаттылыққа үйрет: мүмкін болса, сандарды салыстыр, айырмасын немесе пайызын есептеп көрсет.
- Денсаулыққа қатысты медициналық диагноз қойма; қажет болса, дәрігерге немесе мұғалімге жүгінуге кеңес бер.
- Тақырыптан тыс немесе зиянды сұраққа сыпайы түрде бас тарт та, экология тақырыбына қайта бағытта.
- Жауаптың соңында бір қысқа жолмен «Тексеріп көр: …» деп оқушы өзі тексере алатын нәрсені ұсын.`;

type Msg = { role: "user" | "assistant"; content: string };

// Қарапайым жылдамдық шектеуі (бір сервер данасы ішінде)
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > 12;
}

const fail = (status: number, error: string) => Response.json({ error }, { status });

export async function POST(request: Request) {
  // Көшіргенде қосылып кететін бос орын мен тырнақшаны алып тастаймыз
  const key = process.env.GEMINI_API_KEY?.trim().replace(/^["']+|["']+$/g, "");
  if (!key) return fail(503, "ЖИ көмекші әлі қосылмаған: серверде GEMINI_API_KEY бапталмаған.");

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (limited(ip)) return fail(429, "Сұрақ тым жиі жіберілді. Бір минуттан кейін қайталап көріңіз.");

  let body: { messages?: unknown; context?: unknown };
  try {
    body = await request.json();
  } catch {
    return fail(400, "Сұрау пішімі дұрыс емес.");
  }
  const raw = Array.isArray(body.messages) ? body.messages : [];
  const messages: Msg[] = raw
    .filter((m): m is Msg => !!m && typeof m === "object" && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-MAX_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, MAX_CHARS) }))
    .filter((m) => m.content);
  if (!messages.length || messages[messages.length - 1].role !== "user") return fail(400, "Сұрақ бос.");
  const context = typeof body.context === "string" ? body.context.slice(0, MAX_CONTEXT) : "";

  const systemText = `${SYSTEM}\n\nПЛАТФОРМА ДЕРЕКТЕРІ:\n${platformKnowledge()}${context ? `\n\nОҚУШЫ КӨРІП ОТЫРҒАН ДЕРЕКТЕР (платформадан автоматты түрде алынды):\n${context}` : ""}`;

  // Gemini диалогы user хабарламасынан басталуы керек
  while (messages.length && messages[0].role !== "user") messages.shift();

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/models/${encodeURIComponent(MODEL)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemText }] },
        contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
        generationConfig: { temperature: 0.4, maxOutputTokens: 4096 },
      }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    return fail(502, "ЖИ қызметіне қосылу мүмкін болмады. Интернетті тексеріп, қайталап көріңіз.");
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("Gemini error", res.status, detail.slice(0, 500));
    // Google қатесінің қысқа түсіндірмесі (кілттің өзі онда болмайды) — себебін анықтау үшін
    let reason = "";
    try {
      const e = (JSON.parse(detail) as { error?: { status?: string; message?: string } }).error;
      reason = [e?.status, e?.message].filter(Boolean).join(": ").replace(/key=[^&\s]+/g, "key=…").slice(0, 240);
    } catch {}
    const tail = ` [Google ${res.status}${reason ? `: ${reason}` : ""}]`;
    if (res.status === 429) return fail(429, "ЖИ қызметінің лимиті таусылды. Біраздан кейін қайталап көріңіз." + tail);
    if (res.status === 404) return fail(502, `«${MODEL}» моделі табылмады. GEMINI_MODEL мәнін тексеру керек.` + tail);
    if (res.status === 400 || res.status === 401 || res.status === 403) return fail(502, "ЖИ қызметі сұрауды қабылдамады." + tail);
    return fail(502, "ЖИ қызметі уақытша жауап бермей тұр. Қайталап көріңіз." + tail);
  }

  type Part = { text?: string; thought?: boolean };
  const data = (await res.json()) as { candidates?: { content?: { parts?: Part[] }; finishReason?: string }[] };
  const cand = data.candidates?.[0];
  const text = (cand?.content?.parts ?? []).filter((p) => !p.thought && p.text).map((p) => p.text).join("").trim();
  if (!text) {
    if (cand?.finishReason === "SAFETY") return fail(422, "Бұл сұраққа жауап бере алмаймын. Басқаша сұрап көріңіз.");
    return fail(502, "ЖИ жауап қайтармады. Сұрақты басқаша қойып көріңіз.");
  }
  return Response.json({ text });
}

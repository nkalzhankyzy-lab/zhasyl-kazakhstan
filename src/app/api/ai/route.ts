import { platformKnowledge } from "@/lib/ai/knowledge";

// Gemini кілті тек серверде: GEMINI_API_KEY (Vercel → Settings → Environment Variables).
// Екі түрлі кілт бар: Google AI Studio (әдетте «AIza…») және Vertex AI express («AQ.…»).
// Кілт түріне қарай сәйкес мекенжай алдымен, екіншісі қосалқы ретінде сыналады.
const MODEL = process.env.GEMINI_MODEL;
const STUDIO_BASE = process.env.GEMINI_API_BASE || "https://generativelanguage.googleapis.com/v1beta";
const VERTEX_BASE = process.env.VERTEX_API_BASE || "https://aiplatform.googleapis.com/v1/publishers/google";
const STUDIO_MODELS = MODEL ? [MODEL] : ["gemini-flash-latest", "gemini-2.5-flash"];
const VERTEX_MODELS = MODEL ? [MODEL] : ["gemini-2.5-flash", "gemini-3-flash-preview", "gemini-2.0-flash"];

type Attempt = { label: string; model: string; url: string; headers: Record<string, string> };
function attempts(key: string): Attempt[] {
  const studio = STUDIO_MODELS.map((model) => ({
    label: "AI Studio",
    model,
    url: `${STUDIO_BASE}/models/${encodeURIComponent(model)}:generateContent`,
    headers: { "x-goog-api-key": key },
  }));
  const vertex = VERTEX_MODELS.map((model) => ({
    label: "Vertex AI",
    model,
    url: `${VERTEX_BASE}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,
    headers: {},
  }));
  return key.startsWith("AQ") ? [...vertex, ...studio] : [...studio, ...vertex];
}

function googleReason(detail: string) {
  try {
    const e = (JSON.parse(detail) as { error?: { status?: string; message?: string } | { status?: string; message?: string }[] }).error;
    const err = Array.isArray(e) ? e[0] : e;
    return [err?.status, err?.message].filter(Boolean).join(": ").replace(/key=[^&\s]+/g, "key=…").slice(0, 200);
  } catch {
    return "";
  }
}

const MAX_MESSAGES = 12;
const MAX_CHARS = 2000;
const MAX_CONTEXT = 8000;

const SYSTEM = `Сен — «Жасыл Қазақстан» платформасының ЖИ экокеңесшісісің. Мектеп оқушылары мен мұғалімдерге биология, химия, экология, топырақ, өсімдік және кабинет ауасының сапасы бойынша көмектесесің.

Ережелер:
- Әрқашан қазақ тілінде, қарапайым әрі нақты жаз. Жауап қысқа болсын: 3–8 сөйлем немесе қысқа тізім.
- Алдымен төмендегі ПЛАТФОРМА ДЕРЕКТЕРІНЕ сүйен. Олардан тыс жалпы білім қолдансаң, мұны «жалпы білім бойынша» деп белгіле.
- Дерек пен болжамды ажырат. Білмесең, «нақты білмеймін» деп айт, ойдан сан немесе дереккөз құрастырма.
- Ұсыныс бергенде орынды болса, ӘЛЕМДІК ЗЕРТТЕУЛЕР тізімінен 1–2 зерттеуге «(Автор, жыл)» түрінде сілте. Тізімде жоқ зерттеуді атама.
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
  // Көшіргенде қосылып кететін бос орын, тырнақша және «GEMINI_API_KEY=» бөлігін алып тастаймыз
  const key = process.env.GEMINI_API_KEY?.trim().replace(/^GEMINI_API_KEY\s*[=:]\s*/i, "").replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9_.-]+$/g, "");
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

  const payload = JSON.stringify({
    systemInstruction: { parts: [{ text: systemText }] },
    contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
    generationConfig: { temperature: 0.4, maxOutputTokens: 4096 },
  });

  let res: Response | null = null;
  const errors: { status: number; text: string }[] = [];
  for (const a of attempts(key)) {
    let r: Response;
    try {
      r = await fetch(a.url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...a.headers },
        body: payload,
        signal: AbortSignal.timeout(30_000),
      });
    } catch {
      errors.push({ status: 0, text: `${a.label} ${a.model}: байланыс жоқ` });
      continue;
    }
    if (r.ok) {
      res = r;
      break;
    }
    const detail = await r.text().catch(() => "");
    console.error("Gemini error", a.label, a.model, r.status, detail.slice(0, 500));
    errors.push({ status: r.status, text: `${a.label} ${a.model} ${r.status}${googleReason(detail) ? ": " + googleReason(detail) : ""}` });
    // Лимит немесе Google жағындағы ақау — басқа мекенжайды сынаудың мәні жоқ
    if (r.status === 429 || r.status >= 500) break;
  }

  if (!res) {
    const last = errors[errors.length - 1];
    // Ең пайдалы түсіндірме — 404-тен өзге алғашқы қате
    // Әр мекенжайдың бір қатесі + кілттің қауіпсіз белгісі (алғашқы 4 таңба мен ұзындығы)
    const seen = new Set<string>();
    const lines = errors.filter((e) => {
      const lbl = e.text.split(" ")[0] + e.text.split(" ")[1];
      if (seen.has(lbl) || e.status === 404) return false;
      seen.add(lbl);
      return true;
    });
    const shown = (lines.length ? lines : errors.slice(0, 1)).map((e) => e.text).join(" | ");
    const tail = ` [${shown}; кілт «${key.slice(0, 4)}…», ${key.length} таңба]`;
    if (!last || errors.every((e) => e.status === 0)) return fail(502, "ЖИ қызметіне қосылу мүмкін болмады. Интернетті тексеріп, қайталап көріңіз.");
    if (last.status === 429) return fail(429, "ЖИ қызметінің лимиті таусылды. Біраздан кейін қайталап көріңіз." + tail);
    if (last.status >= 500) return fail(502, "ЖИ қызметі уақытша жауап бермей тұр. Қайталап көріңіз." + tail);
    return fail(502, "ЖИ қызметі сұрауды қабылдамады." + tail);
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

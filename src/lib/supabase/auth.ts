// Кіру күйі. Supabase режимінде деректі бәрі көреді, ал өзгертуге тек редакторлар
// (zk_editors кестесіне қосылған мұғалімдер) рұқсат алады. Шектеуді дерекқордың RLS ережелері қамтамасыз етеді;
// мұндағы күй тек интерфейсті ыңғайлы ету үшін.
// Жергілікті режимде (Supabase жоқ) аккаунт керек емес: әр адам өз браузеріндегі деректі өзгерте алады.

import type { Session } from "@supabase/supabase-js";
import { getSupabase, SUPABASE_ENABLED } from "./client";

export interface AuthState {
  /** Сессия тексеріліп болды ма */
  ready: boolean;
  email: string | null;
  userId: string | null;
  /** Деректі енгізуге/өзгертуге рұқсат бар ма */
  canEdit: boolean;
}

const SERVER_STATE: AuthState = SUPABASE_ENABLED
  ? { ready: false, email: null, userId: null, canEdit: false }
  : { ready: true, email: null, userId: null, canEdit: true };

let state = SERVER_STATE;
let started = false;
const listeners = new Set<() => void>();

function setState(next: AuthState) {
  state = next;
  listeners.forEach((l) => l());
}

async function applySession(session: Session | null) {
  const sb = getSupabase();
  if (!sb || !session) {
    setState({ ready: true, email: null, userId: null, canEdit: false });
    return;
  }
  const user = session.user;
  let canEdit = false;
  const { data, error } = await sb.rpc("zk_is_editor");
  if (!error) canEdit = data === true;
  setState({ ready: true, email: user.email ?? null, userId: user.id, canEdit });
}

function start() {
  if (started) return;
  const sb = getSupabase();
  if (!sb) return;
  started = true;
  void sb.auth.getSession().then(({ data }) => applySession(data.session));
  sb.auth.onAuthStateChange((event, session) => {
    if (event === "INITIAL_SESSION") return;
    // Supabase кеңесі: колбэк ішінде басқа Supabase сұрауын бірден күтпеу
    setTimeout(() => void applySession(session), 0);
  });
}

export const authStore = {
  get: () => state,
  getServer: () => SERVER_STATE,
  subscribe(fn: () => void) {
    listeners.add(fn);
    start();
    return () => listeners.delete(fn);
  },
};

export type AuthResult = { ok: true; message?: string } | { ok: false; message: string };

function authError(message: string): string {
  if (/invalid login credentials/i.test(message)) return "Email немесе құпиясөз қате.";
  if (/email not confirmed/i.test(message)) return "Email әлі расталмаған. Поштаңызға келген хаттағы сілтемені ашыңыз.";
  if (/already registered|already been registered|user already exists/i.test(message)) return "Бұл email бұрын тіркелген. «Кіру» бетін пайдаланыңыз.";
  if (/password should be at least|weak password/i.test(message)) return "Құпиясөз тым қысқа немесе әлсіз. Кемінде 8 таңба жазыңыз.";
  if (/rate limit|too many/i.test(message)) return "Әрекет тым жиі қайталанды. Бірнеше минуттан кейін көріңіз.";
  if (/signups not allowed|signup is disabled/i.test(message)) return "Жаңа тіркелу өшірілген. Әкімшіге хабарласыңыз.";
  if (/failed to fetch|network/i.test(message)) return "Серверге қосылу мүмкін болмады. Интернет байланысын тексеріңіз.";
  return message;
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const sb = getSupabase();
  if (!sb) return { ok: false, message: "Дерекқор бапталмаған." };
  const { data, error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
  if (error) return { ok: false, message: authError(error.message) };
  await applySession(data.session);
  return { ok: true };
}

export async function signUp(email: string, password: string): Promise<AuthResult> {
  const sb = getSupabase();
  if (!sb) return { ok: false, message: "Дерекқор бапталмаған." };
  const { data, error } = await sb.auth.signUp({
    email: email.trim(),
    password,
    options: { emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
  });
  if (error) return { ok: false, message: authError(error.message) };
  if (data.session) {
    await applySession(data.session);
    return { ok: true, message: "Аккаунт ашылды. Деректі енгізу үшін әкімші сізді редакторлар тізіміне қосуы керек." };
  }
  return { ok: true, message: "Поштаңызға растау хаты жіберілді. Сілтемені ашқан соң осы жерден кіріңіз." };
}

export async function signOut() {
  const sb = getSupabase();
  if (!sb) return;
  await sb.auth.signOut();
  await applySession(null);
}

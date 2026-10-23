"use client";

import { BookOpen, Bot, CloudOff, Database, FlaskConical, KeyRound, Library, Layers, LogIn, LogOut, Map as MapIcon, MessageSquareHeart, QrCode, School, Sprout, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth, useSyncStatus } from "@/lib/storage/hooks";
import { signOut } from "@/lib/supabase/auth";
import { SUPABASE_ENABLED } from "@/lib/supabase/client";
import { ChangePassword } from "./ChangePassword";
import { Logo } from "./Logo";
import { useLogin } from "./Providers";

const NAV: { href: string; label: string; short?: string; icon: typeof MapIcon }[] = [
  { href: "/", label: "Экокарта", icon: MapIcon },
  { href: "/garden", label: "Менің бағым", short: "Бағым", icon: Sprout },
  { href: "/lab", label: "Зертхана", icon: FlaskConical },
  { href: "/schools", label: "Мектептер", icon: School },
  { href: "/ai", label: "ЖИ көмекші", short: "ЖИ", icon: Bot },
];

const MENU = [
  { href: "/topyraq", label: "Қызылорда топырағы", icon: Layers },
  { href: "/tekser", label: "Өз бөлмеңді тексер", icon: QrCode },
  { href: "/saualnama", label: "Оқушы сауалнамасы", icon: MessageSquareHeart },
  { href: "/journal", label: "Зерттеу күнделігі", icon: BookOpen },
  { href: "/data", label: "Менің деректерім", icon: Database },
  { href: "/sources", label: "Дереккөздер", icon: Library },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pwOpen, setPwOpen] = useState(false);
  const auth = useAuth();
  const sync = useSyncStatus();
  const login = useLogin();
  const userLabel = auth.email ? auth.email.split("@")[0] : "Қонақ";
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-2.5 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 rounded-xl" aria-label="Жасыл Қазақстан — басты бет">
          <Logo />
          <span className="font-serif text-xl font-bold text-forest sm:text-2xl">Жасыл Қазақстан</span>
        </Link>
        <nav aria-label="Негізгі мәзір" className="ml-auto hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV.map(({ href, label, short, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={isActive(href) ? "page" : undefined}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-2.5 py-2 text-[15px] lg:px-3.5 font-semibold transition ${
                    isActive(href) ? "bg-mint-2 text-forest shadow-sm" : "text-ink/80 hover:bg-mint"
                  }`}
                >
                  <Icon size={18} aria-hidden />
                  <span className="xl:hidden">{short ?? label}</span>
                  <span className="hidden xl:inline">{label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="relative ml-auto lg:ml-2" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-haspopup="menu"
            className="flex h-11 items-center gap-2 rounded-full border border-line bg-paper pl-1.5 pr-3 text-sm font-semibold text-forest shadow-sm hover:bg-mint"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-mint-2">
              <UserRound size={18} aria-hidden />
            </span>
            <span className="hidden max-w-[140px] truncate sm:inline">{userLabel}</span>
            {sync.state === "error" && <CloudOff size={16} className="text-alert" aria-label="Дерекқормен байланыс жоқ" />}
          </button>
          {open && (
            <div role="menu" className="absolute right-0 mt-2 w-72 rounded-2xl border border-line bg-paper p-2 shadow-lift">
              {!SUPABASE_ENABLED ? (
                <p className="px-3 pb-2 pt-1 text-xs text-muted">Аккаунт жоқ: деректер осы браузерде сақталады.</p>
              ) : auth.userId ? (
                <div className="px-3 pb-2 pt-1 text-xs text-muted">
                  <p className="truncate font-semibold text-ink">{auth.email}</p>
                  <p>{auth.canEdit ? "Редактор: деректі енгізе аласыз" : "Редакторлар тізімінде жоқсыз: тек көру"}</p>
                </div>
              ) : (
                <p className="px-3 pb-2 pt-1 text-xs text-muted">Деректі көру үшін кірудің қажеті жоқ. Мұғалімдер деректі енгізу үшін кіреді.</p>
              )}
              {sync.state === "error" && (
                <p className="mx-1 mb-2 rounded-xl bg-orange-50 px-3 py-2 text-xs text-orange-950" role="alert">
                  {sync.message}
                </p>
              )}
              {MENU.map(({ href, label, icon: Icon }) => (
                <Link key={href} role="menuitem" href={href} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium hover:bg-mint">
                  <Icon size={18} className="text-forest" aria-hidden />
                  {label}
                </Link>
              ))}
              {SUPABASE_ENABLED && auth.userId && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    setPwOpen(true);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[15px] font-medium hover:bg-mint"
                >
                  <KeyRound size={18} className="text-forest" aria-hidden />
                  Құпиясөзді өзгерту
                </button>
              )}
              {SUPABASE_ENABLED && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    if (auth.userId) void signOut();
                    else login();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[15px] font-medium hover:bg-mint"
                >
                  {auth.userId ? <LogOut size={18} className="text-forest" aria-hidden /> : <LogIn size={18} className="text-forest" aria-hidden />}
                  {auth.userId ? "Шығу" : "Мұғалім ретінде кіру"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      {pwOpen && <ChangePassword onClose={() => setPwOpen(false)} />}
      {/* Телефондағы мәзір */}
      <nav aria-label="Негізгі мәзір (телефон)" className="border-t border-line/60 lg:hidden">
        <ul className="grid grid-cols-5">
          {NAV.map(({ href, label, short, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 px-0.5 py-1.5 text-[11.5px] font-semibold ${isActive(href) ? "text-forest" : "text-muted"}`}
              >
                <span className={`flex h-7 w-12 items-center justify-center rounded-full ${isActive(href) ? "bg-mint-2" : ""}`}>
                  <Icon size={18} aria-hidden />
                </span>
                <span className="truncate">{short ?? label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

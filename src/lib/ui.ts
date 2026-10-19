/** Телефонда өріс фокусқа келгенде оны пернетақта жаппайтындай көрінетін жерге жылжыту */
export function keepFieldVisible(e: { target: EventTarget }) {
  const el = e.target as HTMLElement;
  if (typeof window === "undefined" || !("scrollIntoView" in el)) return;
  if (!window.matchMedia("(pointer: coarse)").matches) return;
  if (!/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
  setTimeout(() => el.scrollIntoView({ block: "center", behavior: "smooth" }), 280);
}

"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { Dialog } from "../ui/Dialog";

/** Берілген сілтеменің QR-кодын үлкен етіп көрсетеді (проекторға немесе басып шығаруға) */
export function QrDialog({ open, onClose, title, path, note }: { open: boolean; onClose: () => void; title: string; path: string; note?: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const url = typeof window !== "undefined" ? `${window.location.origin}${path}` : path;
  useEffect(() => {
    if (!open) return;
    let alive = true;
    void QRCode.toDataURL(url, { width: 640, margin: 2, color: { dark: "#1f4a2c", light: "#ffffff" } }).then((d) => alive && setSrc(d));
    return () => {
      alive = false;
    };
  }, [open, url]);
  return (
    <Dialog open={open} onClose={onClose} title={title} size="lg">
      <div className="flex flex-col items-center gap-3 py-2">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={`QR-код: ${url}`} className="aspect-square w-full max-w-[420px] rounded-2xl bg-white p-2 ring-1 ring-line" />
        ) : (
          <div className="aspect-square w-full max-w-[420px] animate-pulse rounded-2xl bg-mint" />
        )}
        <p className="break-all text-center text-sm font-semibold text-forest">{url.replace(/^https?:\/\//, "")}</p>
        {note && <p className="text-center text-sm text-muted">{note}</p>}
        {src && (
          <a href={src} download="qr-saualnama.png" className="btn btn-ghost !min-h-10">
            Суретін жүктеу
          </a>
        )}
      </div>
    </Dialog>
  );
}

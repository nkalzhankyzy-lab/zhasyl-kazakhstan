// Суретті сақтау алдында ықшамдау (localStorage көлемі шектеулі).

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

export class ImageTooLargeError extends Error {}

export async function compressImage(file: File, maxSide = 1024, quality = 0.75): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Бұл сурет файлы емес. JPG немесе PNG таңдаңыз.");
  if (file.size > MAX_UPLOAD_BYTES) throw new ImageTooLargeError("Файл тым үлкен (15 МБ-тан асады). Кішірек сурет таңдаңыз.");
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Суретті ашу мүмкін болмады."));
      i.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Суретті өңдеу мүмкін болмады.");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    let data = canvas.toDataURL("image/jpeg", quality);
    // Әлі де үлкен болса — сапасын төмендетеміз
    if (data.length > 900_000) data = canvas.toDataURL("image/jpeg", 0.55);
    return data;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export const dataUrlKb = (s: string) => Math.round((s.length * 3) / 4 / 1024);

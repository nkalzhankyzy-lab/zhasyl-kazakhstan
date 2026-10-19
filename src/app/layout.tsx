import "@fontsource-variable/onest";
import "@fontsource/pt-serif/400.css";
import "@fontsource/pt-serif/700.css";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: { default: "Жасыл Қазақстан — экологиялық білім беру платформасы", template: "%s · Жасыл Қазақстан" },
  description: "Қазақстан картасы арқылы туған өлкенің табиғатын зерттеу және мектеп ортасын өлшеу арқылы экологиялық мәдениет қалыптастыру.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f1e3",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="kk">
      <body className="min-h-dvh antialiased">
        <Providers>
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-xl focus:bg-forest focus:px-4 focus:py-2 focus:text-white">
            Негізгі мазмұнға өту
          </a>
          <Header />
          <main id="main">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "./ui/Badge";

interface Props {
  href: string;
  title: string;
  subtitle: string;
  image: string;
  alt: string;
  badge?: string;
  imageFit?: "cover" | "contain";
}

export function FeatureCard({ href, title, subtitle, image, alt, badge, imageFit = "cover" }: Props) {
  return (
    <Link href={href} className="group card flex h-full flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lift">
      <div className="flex items-start justify-between gap-2 px-4 pb-2 pt-3">
        <div className="min-w-0">
          <h3 className="font-serif text-lg font-bold leading-tight text-forest sm:text-xl">{title}</h3>
          <p className="mt-0.5 text-sm text-muted">{subtitle}</p>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest text-white transition group-hover:translate-x-0.5" aria-hidden>
          <ArrowRight size={18} />
        </span>
      </div>
      <div className={`relative mt-auto aspect-[16/9] ${imageFit === "contain" ? "bg-[#fdf9f0]" : ""}`}>
        <Image src={image} alt={alt} fill sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 340px" className={imageFit === "contain" ? "object-contain object-bottom p-1" : "object-cover"} />
        {badge && (
          <Badge tone="dev" className="absolute bottom-2 left-2">
            {badge}
          </Badge>
        )}
      </div>
    </Link>
  );
}

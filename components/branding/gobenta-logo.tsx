import Image from "next/image";
import { cn } from "@/lib/cn";

type Props = {
  className?: string;
  /** Hint for LCP when used above the fold (navbar / auth hero). */
  priority?: boolean;
  variant?: "header" | "hero" | "footer";
};

const layoutClass = {
  /** 200px wide in header and footer (height follows SVG aspect). `max-w-full` avoids overflow on narrow viewports. */
  header: "h-auto w-[200px] max-w-full",
  hero: "h-[4.5rem] w-auto sm:h-24 md:h-28 lg:h-32 xl:h-36 2xl:h-40",
  footer: "h-auto w-[200px] max-w-full",
} as const;

/** GoBenta.ph wordmark — `public/branding/logo-gobenta.svg` (1536×1024, SVGO-optimized). */
export function GobentaLogo({
  className,
  priority = false,
  variant = "header",
}: Props) {
  return (
    <Image
      src="/branding/logo-gobenta.svg"
      alt="GoBenta.ph"
      width={1536}
      height={1024}
      priority={priority}
      unoptimized
      sizes={
        variant === "hero"
          ? "(max-width:640px) 320px, (max-width:1024px) 384px, 420px"
          : "200px"
      }
      className={cn("block shrink-0", layoutClass[variant], className)}
    />
  );
}

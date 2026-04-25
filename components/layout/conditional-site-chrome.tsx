"use client";

import { usePathname } from "next/navigation";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { SiteFooter } from "@/components/layout/site-footer";

function isExecutivePath(pathname: string | null) {
  if (!pathname) return false;
  return pathname === "/executive" || pathname.startsWith("/executive/");
}

/** Hides public-site chrome (announcement + footer) on the executive console. */
export function ConditionalSiteChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideChrome = isExecutivePath(pathname);

  return (
    <div className="flex min-h-full flex-col">
      {!hideChrome ? <AnnouncementBar /> : null}
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      {!hideChrome ? <SiteFooter /> : null}
    </div>
  );
}

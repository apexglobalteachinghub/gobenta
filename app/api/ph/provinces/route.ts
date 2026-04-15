import { NextResponse } from "next/server";
import { NCR_REGION_CODE } from "@/lib/ph-geo/ncr";

const PSGC = "https://psgc.gitlab.io/api";

export async function GET() {
  try {
    const res = await fetch(`${PSGC}/provinces/`, {
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "PSGC provinces request failed" },
        { status: 502 }
      );
    }
    const provinces = (await res.json()) as { code: string; name: string }[];
    const sorted = [...provinces].sort((a, b) =>
      a.name.localeCompare(b.name, "en", { sensitivity: "base" })
    );
    const withNcr = [
      { code: NCR_REGION_CODE, name: "Metro Manila (NCR)", isRegion: true },
      ...sorted.map((p) => ({ code: p.code, name: p.name, isRegion: false })),
    ];
    return NextResponse.json(withNcr);
  } catch {
    return NextResponse.json(
      { error: "Could not load provinces" },
      { status: 502 }
    );
  }
}

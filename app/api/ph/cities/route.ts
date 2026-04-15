import { NextRequest, NextResponse } from "next/server";
import { NCR_REGION_CODE } from "@/lib/ph-geo/ncr";

const PSGC = "https://psgc.gitlab.io/api";

export async function GET(req: NextRequest) {
  const province = req.nextUrl.searchParams.get("province");
  const region = req.nextUrl.searchParams.get("region");

  let url: string | null = null;
  if (region === NCR_REGION_CODE || region === "ncr") {
    url = `${PSGC}/regions/${NCR_REGION_CODE}/cities-municipalities`;
  } else if (province) {
    url = `${PSGC}/provinces/${encodeURIComponent(province)}/cities-municipalities`;
  }

  if (!url) {
    return NextResponse.json(
      { error: "Missing province or region code" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });
    if (!res.ok) {
      return NextResponse.json(
        { error: "PSGC cities request failed" },
        { status: 502 }
      );
    }
    const data = (await res.json()) as { code: string; name: string }[];
    const sorted = [...data].sort((a, b) =>
      a.name.localeCompare(b.name, "en", { sensitivity: "base" })
    );
    return NextResponse.json(sorted);
  } catch {
    return NextResponse.json(
      { error: "Could not load cities" },
      { status: 502 }
    );
  }
}

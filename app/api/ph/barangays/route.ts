import { NextRequest, NextResponse } from "next/server";

const PSGC = "https://psgc.gitlab.io/api";

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get("city");
  if (!city) {
    return NextResponse.json(
      { error: "Missing city (municipality) code" },
      { status: 400 }
    );
  }

  try {
    const url = `${PSGC}/cities-municipalities/${encodeURIComponent(city)}/barangays`;
    const res = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });
    if (!res.ok) {
      return NextResponse.json(
        { error: "PSGC barangays request failed" },
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
      { error: "Could not load barangays" },
      { status: 502 }
    );
  }
}

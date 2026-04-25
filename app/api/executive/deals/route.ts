import { NextResponse } from "next/server";
import { requireExecutiveApi } from "@/lib/executive/require-executive-api";
import {
  createServiceRoleClient,
  isServiceRoleConfigured,
} from "@/lib/supabase/admin";

export type ExecutiveDealInsights = {
  marked_sold_count: number;
  under_negotiation_count: number;
  listings_with_chat_count: number;
  total_messages_count: number;
};

export type ExecutiveListingChatRow = {
  listing_id: string;
  title: string;
  seller_id: string;
  seller_name: string;
  message_count: number;
  participant_count: number;
  last_message_at: string;
  transaction_completed_at: string | null;
  buyer_id: string | null;
  buyer_name: string;
};

export async function GET(request: Request) {
  const auth = await requireExecutiveApi();
  if ("json" in auth) {
    return NextResponse.json(auth.json, { status: auth.status });
  }

  if (!isServiceRoleConfigured()) {
    return NextResponse.json(
      { error: "Server missing SUPABASE_SERVICE_ROLE_KEY" },
      { status: 503 }
    );
  }

  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(
    100,
    Math.max(5, Number(url.searchParams.get("limit")) || 25)
  );
  const offset = (page - 1) * limit;

  try {
    const admin = createServiceRoleClient();

    const { data: insightsRaw, error: iErr } = await admin.rpc(
      "get_executive_deal_insights"
    );

    const { data: rowsRaw, error: rErr } = await admin.rpc(
      "get_executive_listing_chat_activity",
      { p_limit: limit, p_offset: offset }
    );

    if (iErr) {
      return NextResponse.json(
        {
          error: iErr.message,
          hint: "Run supabase/executive_deals_chat.sql in the Supabase SQL editor.",
        },
        { status: 503 }
      );
    }
    if (rErr) {
      return NextResponse.json(
        {
          error: rErr.message,
          hint: "Run supabase/executive_deals_chat.sql in the Supabase SQL editor.",
        },
        { status: 503 }
      );
    }

    const insights = insightsRaw as ExecutiveDealInsights | null;
    const rows = (rowsRaw ?? []) as ExecutiveListingChatRow[];

    return NextResponse.json({
      insights: insights ?? {
        marked_sold_count: 0,
        under_negotiation_count: 0,
        listings_with_chat_count: 0,
        total_messages_count: 0,
      },
      rows: rows.map((r) => ({
        ...r,
        message_count: Number(r.message_count),
        participant_count: Number(r.participant_count),
      })),
      page,
      limit,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

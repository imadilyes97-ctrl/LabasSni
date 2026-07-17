import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://api.supabase.com/v1/projects/coqolptitdrfxvmbvgzx/database/query", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_MGMT_TOKEN || ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: "SELECT count(*) as cnt FROM clients" }),
    });
    const data = await res.json();
    return NextResponse.json({
      status: "ok",
      db_test: data,
      has_token: !!process.env.SUPABASE_MGMT_TOKEN,
      token_prefix: (process.env.SUPABASE_MGMT_TOKEN || "").slice(0, 10),
    });
  } catch (e: any) {
    return NextResponse.json({
      status: "error",
      error: e.message,
      has_token: !!process.env.SUPABASE_MGMT_TOKEN,
    });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { queryRow } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

// ── GET /api/dashboard/credits ───────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { clientId } = requireAuth(request);

    const row = await queryRow(
      `SELECT plan, credits_total, credits_used, credits_remaining,
              billing_period_start, billing_period_end
       FROM credits
       WHERE client_id = $1`,
      [clientId]
    );

    if (!row) {
      return NextResponse.json(
        { error: "Crédits non trouvés" },
        { status: 404 }
      );
    }

    return NextResponse.json(row);
  } catch (err: any) {
    if (err.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    console.error("GET /api/dashboard/credits error:", err);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

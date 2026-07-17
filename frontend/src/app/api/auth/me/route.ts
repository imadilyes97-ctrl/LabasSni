import { NextRequest, NextResponse } from "next/server";
import { queryRow } from "@/lib/db";
import { getClientIdFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const clientId = getClientIdFromRequest(request);
    if (!clientId) {
      return NextResponse.json({ detail: "Non authentifié" }, { status: 401 });
    }

    const client = await queryRow(
      "SELECT id, nom_boutique, email, ton_assistant, duree_retention, pixel_meta, pixel_tiktok, created_at FROM clients WHERE id = $1",
      [clientId]
    );

    if (!client) {
      return NextResponse.json({ detail: "Client non trouvé" }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (e: any) {
    console.error("[auth/me]", e);
    return NextResponse.json({ detail: "Erreur interne" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { queryRow, execute } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

// ── GET /api/dashboard/config ────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { clientId } = requireAuth(request);

    const row = await queryRow(
      `SELECT ton_assistant, duree_retention, pixel_meta, pixel_tiktok, webhook_url
       FROM clients
       WHERE id = $1`,
      [clientId]
    );

    if (!row) {
      return NextResponse.json(
        { error: "Client non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(row);
  } catch (err: any) {
    if (err.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    console.error("GET /api/dashboard/config error:", err);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

// ── PUT /api/dashboard/config ────────────────────────────────────────────────

export async function PUT(request: NextRequest) {
  try {
    const { clientId } = requireAuth(request);
    const body = await request.json();

    // Champs autorisés pour la mise à jour
    const allowedFields = [
      "ton_assistant",
      "duree_retention",
      "pixel_meta",
      "pixel_tiktok",
      "webhook_url",
    ] as const;

    const updates: Record<string, any> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Aucun champ à mettre à jour" },
        { status: 400 }
      );
    }

    // Construction dynamique du SET clause avec paramètres numérotés
    const keys = Object.keys(updates);
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");
    const values = Object.values(updates);
    values.push(clientId);

    await execute(
      `UPDATE clients SET ${setClause} WHERE id = $${keys.length + 1}`,
      values
    );

    // Re-lire la config mise à jour
    const row = await queryRow(
      `SELECT ton_assistant, duree_retention, pixel_meta, pixel_tiktok, webhook_url
       FROM clients
       WHERE id = $1`,
      [clientId]
    );

    console.log(`⚙️ Config mise à jour pour client ${clientId}: ${keys.join(", ")}`);
    return NextResponse.json(row);
  } catch (err: any) {
    if (err.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    console.error("PUT /api/dashboard/config error:", err);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

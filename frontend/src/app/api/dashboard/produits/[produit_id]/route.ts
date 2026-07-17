import { NextRequest, NextResponse } from "next/server";
import { queryRow, execute } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

// ── DELETE /api/dashboard/produits/[produit_id] ──────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ produit_id: string }> }
) {
  try {
    const { clientId } = requireAuth(request);
    const { produit_id } = await params;

    // Vérifier que le produit appartient au client
    const row = await queryRow(
      "SELECT id FROM produits WHERE id = $1 AND client_id = $2",
      [produit_id, clientId]
    );

    if (!row) {
      return NextResponse.json(
        { error: "Produit non trouvé" },
        { status: 404 }
      );
    }

    await execute("DELETE FROM produits WHERE id = $1", [produit_id]);

    console.log(`🗑️ Produit ${produit_id} supprimé par client ${clientId}`);
    return NextResponse.json({ message: "Produit supprimé" });
  } catch (err: any) {
    if (err.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    console.error("DELETE /api/dashboard/produits/[produit_id] error:", err);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { query, queryRow, execute } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { randomUUID } from "crypto";

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateSlug(nom: string): string {
  let slug = nom.toLowerCase().trim();
  slug = slug.replace(/\s+/g, "-");
  slug = slug.replace(/[^a-z0-9-]/g, "");
  slug = slug.replace(/-+/g, "-").replace(/^-|-$/g, "");
  return slug || "produit";
}

// ── GET /api/dashboard/produits ──────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { clientId } = requireAuth(request);

    const rows = await query(
      `SELECT
        p.id, p.nom, p.description, p.product_type, p.image_url,
        p.landing_slug, p.created_at,
        (SELECT COUNT(*) FROM generations g WHERE g.produit_id = p.id) AS generations_count
      FROM produits p
      WHERE p.client_id = $1
      ORDER BY p.created_at DESC`,
      [clientId]
    );

    return NextResponse.json(rows);
  } catch (err: any) {
    if (err.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    console.error("GET /api/dashboard/produits error:", err);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

// ── POST /api/dashboard/produits ─────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { clientId } = requireAuth(request);
    const body = await request.json();

    const { nom, description, product_type, image_url } = body;

    if (!nom || typeof nom !== "string" || nom.length < 2) {
      return NextResponse.json(
        { error: "Nom du produit trop court (min 2 caractères)" },
        { status: 400 }
      );
    }

    if (!product_type || typeof product_type !== "string") {
      return NextResponse.json(
        { error: "product_type requis" },
        { status: 400 }
      );
    }

    if (!image_url || typeof image_url !== "string") {
      return NextResponse.json(
        { error: "image_url requis" },
        { status: 400 }
      );
    }

    let slug = generateSlug(nom);

    // Garantir l'unicité du slug
    const existing = await queryRow(
      "SELECT id FROM produits WHERE landing_slug = $1",
      [slug]
    );
    if (existing) {
      slug = `${slug}-${randomUUID().replace(/-/g, "").slice(0, 6)}`;
    }

    const row = await queryRow(
      `INSERT INTO produits (client_id, nom, description, product_type, image_url, landing_slug)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [clientId, nom, description || null, product_type, image_url, slug]
    );

    console.log(`📦 Produit créé: ${row.nom} (slug=${slug}) — client=${clientId}`);
    return NextResponse.json(row, { status: 201 });
  } catch (err: any) {
    if (err.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    console.error("POST /api/dashboard/produits error:", err);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

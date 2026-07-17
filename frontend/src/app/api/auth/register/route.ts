import { NextRequest, NextResponse } from "next/server";
import { query, queryRow, execute } from "@/lib/db";
import { hashPassword, createToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { nom_boutique, email, password } = await request.json();

    if (!password || password.length < 6) {
      return NextResponse.json({ detail: "Mot de passe trop court (min 6 caractères)" }, { status: 400 });
    }
    if (!email || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      return NextResponse.json({ detail: "Email invalide" }, { status: 400 });
    }
    if (!nom_boutique || nom_boutique.length < 2) {
      return NextResponse.json({ detail: "Nom de boutique trop court" }, { status: 400 });
    }

    const existing = await queryRow("SELECT id FROM clients WHERE email = $1", [email]);
    if (existing) {
      return NextResponse.json({ detail: "Cet email est déjà utilisé" }, { status: 409 });
    }

    const password_hash = await hashPassword(password);
    await execute(
      "INSERT INTO clients (nom_boutique, email, password_hash) VALUES ($1, $2, $3)",
      [nom_boutique, email, password_hash]
    );

    const client = await queryRow("SELECT id FROM clients WHERE email = $1", [email]);
    if (!client) {
      return NextResponse.json({ detail: "Erreur création du compte" }, { status: 500 });
    }

    // Initialiser crédits Starter (50 générations)
    await execute(
      "INSERT INTO credits (client_id, plan, credits_total, credits_used) VALUES ($1, 'starter', 50, 0)",
      [client.id]
    );

    const token = createToken(client.id);
    return NextResponse.json({ token, client_id: client.id, nom_boutique });
  } catch (e: any) {
    console.error("[auth/register]", e);
    return NextResponse.json({ detail: "Erreur interne" }, { status: 500 });
  }
}

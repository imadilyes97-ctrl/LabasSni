import { NextRequest, NextResponse } from "next/server";
import { queryRow } from "@/lib/db";
import { verifyPassword, createToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    const client = await queryRow(
      "SELECT id, nom_boutique, password_hash FROM clients WHERE email = $1",
      [email]
    );

    if (!client || !(await verifyPassword(password, client.password_hash))) {
      return NextResponse.json({ detail: "Email ou mot de passe incorrect" }, { status: 401 });
    }

    const token = createToken(client.id);
    return NextResponse.json({ token, client_id: client.id, nom_boutique: client.nom_boutique });
  } catch (e: any) {
    console.error("[auth/login]", e);
    return NextResponse.json({ detail: "Erreur interne" }, { status: 500 });
  }
}

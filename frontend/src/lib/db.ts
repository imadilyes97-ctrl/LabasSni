// Couche base de donnees — Supabase Management API (via HTTPS, pas de whitelist IP)
// Remplace l'ancien pool PostgreSQL direct qui necessitait une whitelist IP.
// Utilise la Management API Supabase (REST, port 443) — fonctionne partout.

const SUPABASE_PROJECT_REF = "coqolptitdrfxvmbvgzx";
const SUPABASE_MGMT_TOKEN = process.env.SUPABASE_MGMT_TOKEN || "";
const API_URL = `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/database/query`;

function escapeSQL(value: any): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  // String: echapper les quotes simples
  const str = String(value).replace(/'/g, "''");
  return `'${str}'`;
}

function interpolate(text: string, params?: any[]): string {
  if (!params || params.length === 0) return text;
  let sql = text;
  for (let i = 0; i < params.length; i++) {
    sql = sql.replace(`$${i + 1}`, escapeSQL(params[i]));
  }
  return sql;
}

export async function query(text: string, params?: any[]): Promise<any[]> {
  const sql = interpolate(text, params);
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_MGMT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "Unknown error");
    throw new Error(`DB Error: ${err.slice(0, 200)}`);
  }
  return res.json();
}

export async function queryRow(text: string, params?: any[]): Promise<any | null> {
  const rows = await query(text, params);
  return rows[0] || null;
}

export async function execute(text: string, params?: any[]): Promise<number> {
  await query(text, params);
  return 1; // La Management API ne retourne pas rowCount
}

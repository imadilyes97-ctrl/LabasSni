import { Pool } from "pg";

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL non définie");
    }
    pool = new Pool({ connectionString, max: 5 });
  }
  return pool;
}

export async function query(text: string, params?: any[]): Promise<any[]> {
  const client = await getPool().connect();
  try {
    const result = await client.query(text, params);
    return result.rows;
  } finally {
    client.release();
  }
}

export async function queryRow(text: string, params?: any[]): Promise<any | null> {
  const rows = await query(text, params);
  return rows[0] || null;
}

export async function execute(text: string, params?: any[]): Promise<number> {
  const client = await getPool().connect();
  try {
    const result = await client.query(text, params);
    return result.rowCount || 0;
  } finally {
    client.release();
  }
}

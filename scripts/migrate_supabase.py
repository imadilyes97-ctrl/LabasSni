import asyncio
import asyncpg
import uuid
import hashlib

async def migrate():
    dsn = 'postgresql://postgres:imadil1234.%40@db.chtuhujoxuypuckrvhbf.supabase.co:6543/postgres'

    print('Connexion Supabase...')
    conn = await asyncpg.connect(dsn, timeout=15, statement_cache_size=0)
    print('OK - Connecte!')

    with open('backend/app/models/schema.sql', 'r', encoding='utf-8') as f:
        sql = f.read()

    statements = [s.strip() for s in sql.split(';') if s.strip()]

    ok = 0
    err = 0
    for stmt in statements:
        try:
            await conn.execute(stmt)
            ok += 1
        except Exception as e:
            err += 1
            msg = str(e)[:80].replace('\n', ' ')
            print(f'  Skip: {msg}')

    print(f'Migration: {ok} OK, {err} ignores')

    tables = await conn.fetch(
        "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
    )
    print(f'Tables: {[t["table_name"] for t in tables]}')

    # Test: creer un client
    client_id = uuid.uuid4().hex
    salt = uuid.uuid4().hex[:16]
    pw_hash = f'{salt}${hashlib.sha256(f"{salt}test123".encode()).hexdigest()}'

    await conn.execute(
        'INSERT INTO clients (id, nom_boutique, email, password_hash) VALUES ($1, $2, $3, $4)',
        client_id, 'Test Vercel', 'test@vercel.com', pw_hash
    )
    await conn.execute(
        'INSERT INTO credits (client_id, plan, credits_total, credits_used) VALUES ($1, $2, $3, $4)',
        client_id, 'starter', 50, 0
    )

    row = await conn.fetchrow('SELECT nom_boutique, email FROM clients WHERE id = $1', client_id)
    print(f'Test client: {row["nom_boutique"]} <{row["email"]}>')

    # Cleanup test
    await conn.execute('DELETE FROM clients WHERE id = $1', client_id)
    print('Test cleanup OK')

    await conn.close()
    print('Tout est OK!')

asyncio.run(migrate())

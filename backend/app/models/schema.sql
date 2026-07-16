-- Schéma de base de données lebeSsni v2
-- Multi-tenant: chaque vendeur = un client

-- Vendeurs (clients de la plateforme)
CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    nom_boutique TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    ton_assistant TEXT DEFAULT 'chaleureux, rassurant, concis',
    duree_retention TEXT DEFAULT '24 heures',
    pixel_meta TEXT,
    pixel_tiktok TEXT,
    webhook_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Produits (créés par chaque vendeur)
CREATE TABLE IF NOT EXISTS produits (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    product_type TEXT NOT NULL CHECK(product_type IN (
        't-shirt', 'chemise', 'veste', 'manteau', 'pull',
        'pantalon', 'jean', 'short', 'jupe', 'robe',
        'basket', 'chaussures', 'accessoire', 'tenue_complete'
    )),
    mode_generation TEXT DEFAULT 'article_unique' CHECK(mode_generation IN (
        'article_unique', 'tenue_complete', 'sequentiel'
    )),
    landing_slug TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Générations d'images
CREATE TABLE IF NOT EXISTS generations (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    produit_id TEXT REFERENCES produits(id) ON DELETE SET NULL,
    client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    visitor_id TEXT,  -- hash anonyme du visiteur
    user_image_url TEXT,  -- stockage temporaire
    result_image_url TEXT,
    statut TEXT DEFAULT 'pending' CHECK(statut IN ('pending', 'processing', 'success', 'fail')),
    duree_generation_ms INTEGER,
    mode TEXT,
    product_type TEXT,
    quality_score REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME  -- AUTO-DELETE: timestamp de suppression
);

-- Abonnements / Crédits
CREATE TABLE IF NOT EXISTS credits (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    client_id TEXT NOT NULL UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
    plan TEXT DEFAULT 'starter' CHECK(plan IN ('starter', 'pro', 'business')),
    credits_total INTEGER DEFAULT 50,
    credits_used INTEGER DEFAULT 0,
    credits_remaining INTEGER GENERATED ALWAYS AS (credits_total - credits_used) STORED,
    billing_period_start DATE DEFAULT (date('now')),
    billing_period_end DATE DEFAULT (date('now', '+1 month')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Analytics (journalier)
CREATE TABLE IF NOT EXISTS analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    visiteurs INTEGER DEFAULT 0,
    generations INTEGER DEFAULT 0,
    clics_achat INTEGER DEFAULT 0,
    UNIQUE(client_id, date)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_produits_client ON produits(client_id);
CREATE INDEX IF NOT EXISTS idx_generations_client ON generations(client_id);
CREATE INDEX IF NOT EXISTS idx_generations_produit ON generations(produit_id);
CREATE INDEX IF NOT EXISTS idx_generations_expires ON generations(expires_at);
CREATE INDEX IF NOT EXISTS idx_analytics_client_date ON analytics(client_id, date);

-- Trigger: auto-delete des images expirées
CREATE TRIGGER IF NOT EXISTS auto_delete_expired_generations
    AFTER INSERT ON generations
BEGIN
    DELETE FROM generations
    WHERE expires_at IS NOT NULL
    AND expires_at < datetime('now');
END;

CREATE TABLE IF NOT EXISTS record_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "orderID" BIGINT,
    owner UUID NOT NULL REFERENCES players(uid) ON DELETE CASCADE,
    "recordNo" BIGINT NOT NULL,
    "levelID" BIGINT NOT NULL REFERENCES levels(id),
    template INTEGER NOT NULL DEFAULT 1,
    material TEXT NOT NULL CHECK (material IN ('paper', 'plastic')),
    img TEXT,
    printed BOOLEAN DEFAULT FALSE
);

-- Migration initiale DFM Checker
-- Tables pour le dashboard admin : analytics, errors, feedbacks

-- ── Analytics ──
CREATE TABLE IF NOT EXISTS analytics (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    date        DATE NOT NULL DEFAULT CURRENT_DATE,
    material    TEXT NOT NULL,
    problems_count INTEGER NOT NULL DEFAULT 0,
    high_count  INTEGER NOT NULL DEFAULT 0,
    medium_count INTEGER NOT NULL DEFAULT 0,
    low_count   INTEGER NOT NULL DEFAULT 0,
    error       BOOLEAN NOT NULL DEFAULT FALSE,
    error_msg   TEXT,
    file_size_kb REAL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics(date);

-- ── Errors ──
CREATE TABLE IF NOT EXISTS errors (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    type        TEXT NOT NULL CHECK(type IN ('api','upload','analysis','system')),
    message     TEXT NOT NULL,
    details     TEXT NOT NULL DEFAULT '',
    severity    TEXT NOT NULL DEFAULT 'medium' CHECK(severity IN ('high','medium','low')),
    resolved    BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_errors_timestamp ON errors(timestamp DESC);

-- ── Feedbacks ──
CREATE TABLE IF NOT EXISTS feedbacks (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    date        DATE NOT NULL DEFAULT CURRENT_DATE,
    message     TEXT NOT NULL,
    email       TEXT NOT NULL DEFAULT '',
    status      TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','read','archived'))
);

CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON feedbacks(status);

-- ── Row Level Security ──
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

-- Lecture : accessible à tous (via la clé anon)
-- Écriture : restreinte aux utilisateurs authentifiés (sauf feedbacks où anon peut insérer)
CREATE POLICY "Allow anon read analytics" ON analytics FOR SELECT USING (true);
CREATE POLICY "Allow auth insert analytics" ON analytics FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow anon read errors" ON errors FOR SELECT USING (true);
CREATE POLICY "Allow auth insert errors" ON errors FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow auth update errors" ON errors FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow anon read feedbacks" ON feedbacks FOR SELECT USING (true);
CREATE POLICY "Allow anon insert feedbacks" ON feedbacks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow auth update feedbacks" ON feedbacks FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all" ON sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON user_activity FOR ALL USING (true) WITH CHECK (true);

// Default embedded SVG emblem for Pemerintah Kabupaten Sidoarjo / Kecamatan Tulangan
// Uses inline data URI so it always renders reliably offline and in sandboxes.
const CREST_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120" fill="none">
  <rect width="120" height="120" rx="20" fill="#0F172A"/>
  <path d="M60 16L96 30V58C96 81.5 80.5 100.8 60 107C39.5 100.8 24 81.5 24 58V30L60 16Z" fill="#065F46" stroke="#FBBF24" stroke-width="3"/>
  <path d="M60 27L84 36.5V56.5C84 74 73.2 88.2 60 93.2C46.8 88.2 36 74 36 56.5V36.5L60 27Z" fill="#0F172A" stroke="#34D399" stroke-width="1.5"/>
  <polygon points="60,36 64.5,48.5 78,48.5 67,56.5 71,69 60,61.5 49,69 53,56.5 42,48.5 55.5,48.5" fill="#FBBF24"/>
  <path d="M44 77H76" stroke="#34D399" stroke-width="2.5" stroke-linecap="round"/>
</svg>`;

export const DEFAULT_LOGO_DATA_URI = `data:image/svg+xml;utf8,${encodeURIComponent(CREST_SVG)}`;

export const RAW_SQL_SCHEMA = `-- ============================================================================
-- SKEMA DATABASE SITARA v2.1 (Backend-Ready SQL)
-- Sistem Informasi Antrean dan Rekapitulasi Pelayanan Kecamatan Tulangan
-- Kompatibel dengan PostgreSQL 15+ / MySQL 8+
-- ============================================================================

-- 1. Tabel Pengguna (Multi-Role Authentication)
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    username        VARCHAR(50) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(20) NOT NULL CHECK (role IN ('petugas', 'admin', 'pimpinan')),
    full_name       VARCHAR(100) NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Jenis Layanan Kecamatan
CREATE TABLE services (
    id              SERIAL PRIMARY KEY,
    service_name    VARCHAR(100) NOT NULL,
    description     VARCHAR(255),
    icon            VARCHAR(50) NOT NULL DEFAULT 'file-text',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE
);

-- 3. Tabel Loket Pelayanan
CREATE TABLE counters (
    id              SERIAL PRIMARY KEY,
    counter_name    VARCHAR(50) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'serving')),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE
);

-- 4. Tabel Antrean (Single Queue & Auto-Reset Harian)
CREATE TABLE queues (
    id              SERIAL PRIMARY KEY,
    queue_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    queue_number    VARCHAR(10) NOT NULL,
    service_id      INT NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
    counter_id      INT REFERENCES counters(id) ON DELETE SET NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'called', 'completed', 'skipped')),
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    called_at       TIMESTAMP NULL,
    completed_at    TIMESTAMP NULL,
    CONSTRAINT uq_queue_per_day UNIQUE (queue_date, queue_number)
);

CREATE INDEX idx_queues_date_status ON queues (queue_date, status);
CREATE INDEX idx_queues_service_date ON queues (service_id, queue_date);

-- 5. Tabel Pengaturan Sistem & Custom Branding (v2.1)
CREATE TABLE settings (
    id              INT PRIMARY KEY DEFAULT 1,
    logo_url        TEXT NOT NULL,
    header_text     VARCHAR(120) NOT NULL DEFAULT 'SITARA',
    subheader_text  VARCHAR(255) NOT NULL DEFAULT 'Sistem Informasi Antrean Kecamatan Tulangan',
    total_counters  INT NOT NULL DEFAULT 4 CHECK (total_counters BETWEEN 2 AND 5),
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- DATA AWAL (SEED DATA)
-- ============================================================================

INSERT INTO users (username, password_hash, role, full_name) VALUES
('petugas', '$2b$12$demo_hash_petugas_12345', 'petugas', 'Petugas Pelayanan 1'),
('admin', '$2b$12$demo_hash_admin_12345', 'admin', 'Administrator Sistem'),
('pimpinan', '$2b$12$demo_hash_pimpinan_12345', 'pimpinan', 'Camat Tulangan');

INSERT INTO services (service_name, description, icon, is_active) VALUES
('KTP-el', 'Perekaman & Pencetakan KTP Elektronik', 'id-card', TRUE),
('KK', 'Penerbitan & Perubahan Kartu Keluarga', 'users', TRUE),
('KIA', 'Kartu Identitas Anak (Usia 0-17 Tahun)', 'baby', TRUE),
('Aktivasi IKD', 'Aktivasi Identitas Kependudukan Digital', 'smartphone', TRUE),
('Layanan Lainnya', 'Legalisir, Surat Keterangan & Pengantar', 'file-text', TRUE);

INSERT INTO counters (counter_name, status, is_active) VALUES
('Loket 1', 'idle', TRUE),
('Loket 2', 'idle', TRUE),
('Loket 3', 'idle', TRUE),
('Loket 4', 'idle', TRUE),
('Loket 5', 'idle', FALSE);

INSERT INTO settings (id, logo_url, header_text, subheader_text, total_counters) VALUES
(1, '/assets/logo-tulangan.png', 'SITARA', 'Sistem Informasi Antrean Kecamatan Tulangan', 4);
`;

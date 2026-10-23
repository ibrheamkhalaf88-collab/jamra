-- Run once against the new production D1 database before the first deploy.
CREATE TABLE IF NOT EXISTS jamra_projects (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  project_url TEXT NOT NULL DEFAULT '',
  cover_key TEXT NOT NULL DEFAULT '',
  video_url TEXT NOT NULL DEFAULT '',
  gallery_json TEXT NOT NULL DEFAULT '[]',
  features_json TEXT NOT NULL DEFAULT '[]',
  published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS jamra_inquiries (
  id TEXT PRIMARY KEY NOT NULL,
  access_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  contact TEXT NOT NULL,
  contact_method TEXT NOT NULL,
  source TEXT NOT NULL,
  goal TEXT NOT NULL,
  service TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  ip_hash TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS jamra_inquiry_messages (
  id TEXT PRIMARY KEY NOT NULL,
  inquiry_id TEXT NOT NULL,
  author TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS jamra_admin_attempts (
  ip_hash TEXT PRIMARY KEY NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  window_started INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS jamra_projects_published_created_idx ON jamra_projects(published, created_at DESC);
CREATE INDEX IF NOT EXISTS jamra_inquiries_updated_idx ON jamra_inquiries(updated_at DESC);
CREATE INDEX IF NOT EXISTS jamra_inquiries_ip_created_idx ON jamra_inquiries(ip_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS jamra_messages_inquiry_created_idx ON jamra_inquiry_messages(inquiry_id, created_at);

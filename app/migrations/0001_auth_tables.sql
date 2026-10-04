-- ============================================================
-- BiyeFlow Auth Schema v1
-- Run against D1: wrangler d1 execute BIYEFLOW_DB --file=migrations/0001_auth_tables.sql
-- ============================================================

-- Platform users (Google OAuth identity)
CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  avatar_url  TEXT,
  google_sub  TEXT UNIQUE,
  platform_role TEXT NOT NULL DEFAULT 'customer',
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

-- Login sessions (HttpOnly cookie based)
CREATE TABLE IF NOT EXISTS auth_sessions (
  token_hash  TEXT PRIMARY KEY NOT NULL,
  user_id     TEXT NOT NULL,
  device_id   TEXT,
  device_label TEXT,
  expires_at  INTEGER NOT NULL,
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions(user_id);

-- Events (replaces wedding code as the top-level entity)
CREATE TABLE IF NOT EXISTS events (
  id          TEXT PRIMARY KEY NOT NULL,
  code        TEXT UNIQUE NOT NULL,
  owner_id    TEXT NOT NULL,
  name        TEXT NOT NULL DEFAULT 'My Event',
  event_type  TEXT NOT NULL DEFAULT 'wedding',
  config      TEXT,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_owner ON events(owner_id);

-- Memberships (who can access which event, with what role)
CREATE TABLE IF NOT EXISTS memberships (
  id          TEXT PRIMARY KEY NOT NULL,
  event_id    TEXT NOT NULL,
  user_id     TEXT,
  role        TEXT NOT NULL DEFAULT 'guest',
  module_grants TEXT,
  status      TEXT NOT NULL DEFAULT 'active',
  blocked_by  TEXT,
  blocked_at  INTEGER,
  invited_at  INTEGER,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL,
  UNIQUE(event_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_memberships_event ON memberships(event_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);

-- Devices per user per event
CREATE TABLE IF NOT EXISTS user_devices (
  id          TEXT PRIMARY KEY NOT NULL,
  device_id   TEXT NOT NULL,
  user_id     TEXT NOT NULL,
  event_id    TEXT NOT NULL,
  label       TEXT,
  platform    TEXT DEFAULT 'web',
  last_seen   INTEGER NOT NULL,
  revoked_at  INTEGER,
  revoked_by  TEXT,
  push_endpoint TEXT,
  push_p256dh   TEXT,
  push_auth     TEXT,
  UNIQUE(device_id, user_id, event_id)
);
CREATE INDEX IF NOT EXISTS idx_user_devices_user_event ON user_devices(user_id, event_id);

-- Push notification log
CREATE TABLE IF NOT EXISTS notifications (
  id          TEXT PRIMARY KEY NOT NULL,
  event_id    TEXT NOT NULL,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT,
  target_role TEXT,
  target_user_id TEXT,
  payload     TEXT,
  sent_at     INTEGER,
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notifications_event ON notifications(event_id);

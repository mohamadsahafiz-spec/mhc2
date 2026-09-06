-- Migration: 0002_add_image_chunks.sql
-- Adds dedicated image_chunks table for durable zero-cost binary image storage in Cloudflare D1

CREATE TABLE IF NOT EXISTS image_chunks (
  image_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  total_chunks INTEGER NOT NULL,
  data BLOB NOT NULL,
  mime_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (image_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_image_chunks_id ON image_chunks (image_id);

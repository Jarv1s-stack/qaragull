-- Run this once in the Supabase SQL Editor. `npm run db:setup` verifies the tables afterward.
CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  avatar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.plant_scans (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  storage_path TEXT,
  common_name VARCHAR(255),
  scientific_name VARCHAR(255),
  description TEXT,
  origin VARCHAR(255),
  sunlight VARCHAR(255),
  water VARCHAR(255),
  growth_rate VARCHAR(255),
  accuracy INTEGER CHECK (accuracy IS NULL OR accuracy BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.plant_scans ADD COLUMN IF NOT EXISTS storage_path TEXT;
CREATE INDEX IF NOT EXISTS plant_scans_user_created_idx
  ON public.plant_scans (user_id, created_at DESC);

-- The backend accesses these tables with its server-only Supabase secret key; public roles get no row access.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plant_scans ENABLE ROW LEVEL SECURITY;

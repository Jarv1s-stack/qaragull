-- Additive-only Qaragull field-lab migration. Existing users and scans are preserved.
ALTER TABLE public.plant_scans ADD COLUMN IF NOT EXISTS diagnosis JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.plant_scans ADD COLUMN IF NOT EXISTS species_candidates JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.plant_scans ADD COLUMN IF NOT EXISTS affected_regions JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.plant_scans ADD COLUMN IF NOT EXISTS follow_up_questions JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.plant_profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  common_name VARCHAR(255),
  scientific_name VARCHAR(255),
  scan_id INTEGER REFERENCES public.plant_scans(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS plant_profiles_user_created_idx ON public.plant_profiles (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.care_events (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  profile_id BIGINT NOT NULL REFERENCES public.plant_profiles(id) ON DELETE CASCADE,
  event_type VARCHAR(40) NOT NULL,
  notes VARCHAR(1000) NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS care_events_profile_created_idx ON public.care_events (profile_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.sensor_readings (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  profile_id BIGINT REFERENCES public.plant_profiles(id) ON DELETE SET NULL,
  source VARCHAR(20) NOT NULL DEFAULT 'demo',
  soil_moisture NUMERIC(5,2), light_lux NUMERIC(10,2), temperature_c NUMERIC(5,2), leaf_signal NUMERIC(8,3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS sensor_readings_user_created_idx ON public.sensor_readings (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.experiments (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR(160) NOT NULL,
  hypothesis VARCHAR(1000) NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'complete')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.experiment_measurements (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  experiment_id BIGINT NOT NULL REFERENCES public.experiments(id) ON DELETE CASCADE,
  group_name VARCHAR(80) NOT NULL DEFAULT 'Бақылау',
  height_cm NUMERIC(7,2), leaf_count INTEGER, soil_moisture NUMERIC(5,2),
  notes VARCHAR(1000) NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS experiment_measurements_exp_created_idx ON public.experiment_measurements (experiment_id, created_at ASC);

-- Only coarse consented grid cells are stored. The API rounds input coordinates to 0.25 degrees.
CREATE TABLE IF NOT EXISTS public.community_observations (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  common_name VARCHAR(255) NOT NULL,
  scientific_name VARCHAR(255), issue VARCHAR(120),
  grid_lat NUMERIC(5,2), grid_lng NUMERIC(5,2),
  consent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS community_observations_grid_created_idx ON public.community_observations (grid_lat, grid_lng, created_at DESC);

CREATE TABLE IF NOT EXISTS public.expert_reviews (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  scan_id INTEGER REFERENCES public.plant_scans(id) ON DELETE SET NULL,
  question VARCHAR(1000) NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'reviewed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.plant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_reviews ENABLE ROW LEVEL SECURITY;

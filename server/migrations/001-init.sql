BEGIN;

CREATE TABLE IF NOT EXISTS migrations (
  id TEXT PRIMARY KEY,
  run_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,                -- uuid string
  name TEXT NOT NULL,
  weight_kg REAL NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS foods (
  id TEXT PRIMARY KEY,                -- FoodId (uuid string)
  profile_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Proteins','Veggies','Carbs','Others')),
  unit TEXT NOT NULL CHECK (unit IN ('g','pc')),
  kcal_per_unit REAL NOT NULL,
  protein_per_unit REAL NOT NULL,
  default_portion REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS meal_definitions (
  id TEXT PRIMARY KEY,                -- MealId (uuid string)
  profile_id TEXT NOT NULL,
  name TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1, -- 0/1
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS target_types (
  id TEXT PRIMARY KEY,                -- TargetId (uuid string)
  profile_id TEXT NOT NULL,
  name TEXT NOT NULL,
  min_kcal REAL NOT NULL,
  max_kcal REAL NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS schedule (
  id TEXT PRIMARY KEY,                -- uuid string
  profile_id TEXT NOT NULL,
  date TEXT NOT NULL,                 -- YYYY-MM-DD
  target_type_id TEXT,                -- nullable = no target assigned
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (target_type_id) REFERENCES target_types(id) ON DELETE SET NULL,
  UNIQUE (profile_id, date)
);

CREATE INDEX IF NOT EXISTS idx_foods_profile_id ON foods(profile_id);
CREATE INDEX IF NOT EXISTS idx_meals_profile_id ON meal_definitions(profile_id);
CREATE INDEX IF NOT EXISTS idx_targets_profile_id ON target_types(profile_id);
CREATE INDEX IF NOT EXISTS idx_schedule_profile_date ON schedule(profile_id, date);

COMMIT;
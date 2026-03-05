-- Drop the unique index that enforced at most one active event
DROP INDEX IF EXISTS events_is_active_unique;

-- Also drop any other unique constraint on is_active (covers different naming conventions)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'events'::regclass
      AND contype = 'u'
      AND conname ILIKE '%is_active%'
  LOOP
    EXECUTE 'ALTER TABLE events DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
  END LOOP;
END
$$;

-- Make is_active nullable (no longer required)
ALTER TABLE events ALTER COLUMN is_active DROP NOT NULL;
ALTER TABLE events ALTER COLUMN is_active SET DEFAULT NULL;

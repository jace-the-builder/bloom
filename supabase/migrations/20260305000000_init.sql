-- Events table
create table if not exists events (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  date       date not null,
  is_active  boolean not null default false,
  created_at timestamptz not null default now()
);

-- Flowers table
create table if not exists flowers (
  id                  uuid primary key default gen_random_uuid(),
  event_id            uuid not null references events(id) on delete cascade,
  contributor_name    text not null,
  mantra              text not null,
  flower_image_url    text not null,
  bouquet_position_x  float,
  bouquet_position_y  float,
  bouquet_rotation    float,
  stem_variant        integer,
  created_at          timestamptz not null default now()
);

-- Only one event can be active at a time
create unique index if not exists events_one_active
  on events (is_active)
  where is_active = true;

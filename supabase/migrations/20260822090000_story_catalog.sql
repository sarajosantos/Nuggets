-- Story Studio catalog: drafts are private to staff; published content is
-- available to readers through the server's public catalog endpoint.
create table if not exists public.world_catalog (
  id text primary key check (id ~ '^[a-z0-9][a-z0-9_-]{1,79}$'),
  draft_data jsonb not null,
  published_data jsonb,
  active boolean not null default true,
  version integer not null default 1,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

alter table public.world_catalog enable row level security;

-- The service role is the only writer/reader. Public readers receive only
-- published rows through the server, never direct table access.
drop policy if exists "world catalog is server only" on public.world_catalog;

create index if not exists world_catalog_active_idx
  on public.world_catalog (active, updated_at desc);

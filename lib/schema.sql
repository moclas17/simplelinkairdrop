-- Claims table for one-time URLs
create table if not exists public.claims (
  id text primary key,              -- UUID string from backend
  amount numeric not null,          -- token amount per link (human units)
  claimed boolean not null default false,
  status text not null default 'new', -- new | processing | done
  tx_hash text,
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  expires_at timestamptz
);

-- Helpful indexes
create index if not exists claims_status_idx on public.claims(status);
create index if not exists claims_claimed_idx on public.claims(claimed);

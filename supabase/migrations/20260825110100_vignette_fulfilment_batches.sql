-- Fulfilment batches and deterministic customer delivery matching.
-- Migration versions are unique and strictly ordered.
create table if not exists public.vignette_fulfilment_batches (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  provider text not null,
  status text not null default 'draft' check (status in ('draft','submitted','received','processing','completed','failed')),
  snapshot jsonb not null default '[]'::jsonb,
  source_file_path text,
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  received_at timestamptz,
  completed_at timestamptz
);

create table if not exists public.vignette_fulfilment_matches (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.vignette_fulfilment_batches(id) on delete cascade,
  fulfilment_id uuid,
  order_id uuid references public.vignette_orders(id) on delete set null,
  source_file text not null,
  status text not null check (status in ('matched','needs_review','unmatched')),
  match_data jsonb not null default '{}'::jsonb,
  operator_reference text,
  confirmation_file_path text,
  confirmation_sha256 text,
  created_at timestamptz not null default now()
);

create table if not exists public.vignette_delivery_messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.vignette_orders(id) on delete cascade,
  fulfilment_match_id uuid references public.vignette_fulfilment_matches(id) on delete set null,
  recipient_email text not null,
  status text not null default 'pending' check (status in ('pending','sending','sent','failed')),
  provider_message_id text,
  attempts integer not null default 0,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists vignette_delivery_one_sent_idx
  on public.vignette_delivery_messages(order_id)
  where status = 'sent';

create unique index if not exists vignette_delivery_pending_unique
  on public.vignette_delivery_messages(order_id)
  where status in ('pending','sending','sent');

create unique index if not exists vignette_match_file_idx
  on public.vignette_fulfilment_matches(batch_id, source_file);

create index if not exists vignette_batch_status_idx
  on public.vignette_fulfilment_batches(status);

create index if not exists vignette_match_status_idx
  on public.vignette_fulfilment_matches(status);

create index if not exists vignette_delivery_status_idx
  on public.vignette_delivery_messages(status);

create index if not exists vignette_delivery_order_status_idx
  on public.vignette_delivery_messages(order_id, status);

alter table public.vignette_fulfilment_batches enable row level security;
alter table public.vignette_fulfilment_matches enable row level security;
alter table public.vignette_delivery_messages enable row level security;

revoke all on table public.vignette_fulfilment_batches from anon, authenticated;
revoke all on table public.vignette_fulfilment_matches from anon, authenticated;
revoke all on table public.vignette_delivery_messages from anon, authenticated;

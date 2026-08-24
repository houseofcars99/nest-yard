-- VignetteGO fulfilment tracking.
-- Keeps operator integration state separate from payment and customer data.

alter table public.vignette_order_items
  add column if not exists fulfilment_provider text,
  add column if not exists fulfilment_attempts integer not null default 0,
  add column if not exists fulfilment_last_error text,
  add column if not exists fulfilment_started_at timestamptz,
  add column if not exists fulfilment_completed_at timestamptz;

create index if not exists vignette_order_items_provider_idx
  on public.vignette_order_items(fulfilment_provider);

create table if not exists public.vignette_fulfilment_events (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references public.vignette_order_items(id) on delete cascade,
  provider text not null,
  event_type text not null,
  status text not null,
  message text not null default '',
  provider_reference text,
  created_at timestamptz not null default now()
);

create index if not exists vignette_fulfilment_events_item_idx
  on public.vignette_fulfilment_events(order_item_id, created_at desc);

alter table public.vignette_fulfilment_events enable row level security;
revoke all on table public.vignette_fulfilment_events from anon, authenticated;

-- Fulfilment events are written only by the trusted server route.

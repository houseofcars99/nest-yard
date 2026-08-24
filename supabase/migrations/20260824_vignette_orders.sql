-- VignetteGO order model.
-- Run this migration in the dedicated Supabase project used by the vignette platform.
create extension if not exists pgcrypto;

create table if not exists public.vignette_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  customer_first_name text not null,
  customer_last_name text not null,
  customer_email text not null,
  status text not null default 'pending' check (status in ('pending','paid','processing','completed','failed','cancelled')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','pending','paid','refunded','failed')),
  total_amount numeric(12,2) not null,
  currency text not null,
  accepted_terms_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vignette_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.vignette_orders(id) on delete cascade,
  product_id text not null,
  country_code text not null,
  product_name text not null,
  validity text not null,
  vehicle_type text not null,
  registration_country text not null,
  registration_number text not null,
  fuel_type text,
  start_date date,
  final_price numeric(12,2) not null,
  currency text not null,
  fulfilment_status text not null default 'pending' check (fulfilment_status in ('pending','processing','completed','failed')),
  operator_reference text,
  operator_confirmation text,
  created_at timestamptz not null default now()
);

create index if not exists vignette_orders_email_idx on public.vignette_orders(customer_email);
create index if not exists vignette_orders_status_idx on public.vignette_orders(status);
create index if not exists vignette_order_items_order_idx on public.vignette_order_items(order_id);
create index if not exists vignette_order_items_fulfilment_idx on public.vignette_order_items(fulfilment_status);

alter table public.vignette_orders enable row level security;
alter table public.vignette_order_items enable row level security;

-- No anonymous browser writes. Orders are created by trusted server-side code.
revoke all on table public.vignette_orders from anon, authenticated;
revoke all on table public.vignette_order_items from anon, authenticated;

grant select on public.vignette_orders to authenticated;
grant select on public.vignette_order_items to authenticated;

create policy "customers can read their own orders"
on public.vignette_orders
for select
to authenticated
using ((select auth.jwt()->>'email') = customer_email);

create policy "customers can read their own order items"
on public.vignette_order_items
for select
to authenticated
using (
  exists (
    select 1 from public.vignette_orders o
    where o.id = order_id
      and (select auth.jwt()->>'email') = o.customer_email
  )
);

-- The service/secret key is intentionally required for server-side order creation.
-- Never expose it in browser code. Supabase documents that secret/service_role keys bypass RLS.

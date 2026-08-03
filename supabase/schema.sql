-- Docelowy schemat Nest & Yard. Uruchomić w osobnym projekcie Supabase.
create extension if not exists pgcrypto;

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category text not null,
  category_slug text not null,
  short_description text not null default '',
  description text not null default '',
  price numeric(12,2),
  old_price numeric(12,2),
  purchase_price numeric(12,2),
  vat_rate numeric(5,2) not null default 23,
  sku text unique,
  stock integer,
  allegro_offer_id text unique,
  allegro_url text,
  image_url text,
  palette text not null default 'sage',
  badge text not null default '',
  featured boolean not null default false,
  published boolean not null default false,
  material text not null default '',
  dimensions text not null default '',
  color text not null default '',
  clicks bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  allegro_order_id text unique not null,
  buyer_name text not null default '',
  buyer_login text not null default '',
  buyer_email text not null default '',
  buyer_tax_id text not null default '',
  delivery_address text not null default '',
  delivery_method text not null default '',
  tracking_number text not null default '',
  status text not null,
  payment_status text not null,
  paid_amount numeric(12,2) not null default 0,
  delivery_cost numeric(12,2) not null default 0,
  allegro_fees numeric(12,2) not null default 0,
  invoice_requested boolean not null default false,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  allegro_offer_id text,
  name text not null,
  sku text,
  quantity numeric(12,3) not null,
  unit_price numeric(12,2) not null,
  vat_rate numeric(5,2) not null default 23
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  number text unique not null,
  order_id uuid references orders(id) on delete set null,
  allegro_order_id text,
  issue_date date not null,
  sale_date date not null,
  due_date date not null,
  payment_method text not null default '',
  seller_data jsonb not null,
  buyer_data jsonb not null,
  notes text not null default '',
  status text not null default 'DRAFT',
  ksef_number text,
  pdf_path text,
  created_at timestamptz not null default now()
);

create table if not exists invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  name text not null,
  quantity numeric(12,3) not null,
  unit text not null default 'szt.',
  unit_gross numeric(12,2) not null,
  vat_rate numeric(5,2) not null default 23
);

create table if not exists allegro_connections (
  id uuid primary key default gen_random_uuid(),
  seller_id text unique,
  environment text not null default 'production',
  encrypted_access_token text,
  encrypted_refresh_token text,
  access_token_expires_at timestamptz,
  scopes text[] not null default '{}',
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS należy włączyć po podłączeniu właściwego uwierzytelniania administratora.

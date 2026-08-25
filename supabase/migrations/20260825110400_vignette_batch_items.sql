-- Bind order items to a fulfilment batch so paid items cannot be exported twice.
alter table public.vignette_order_items
  add column if not exists fulfilment_batch_id uuid references public.vignette_fulfilment_batches(id) on delete set null;

create index if not exists vignette_order_items_batch_idx
  on public.vignette_order_items(fulfilment_batch_id);

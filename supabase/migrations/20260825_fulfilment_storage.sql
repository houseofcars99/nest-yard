insert into storage.buckets (id, name, public)
values ('vignettes', 'vignettes', false)
on conflict (id) do update set public = false;

create index if not exists vignette_delivery_order_status_idx
  on public.vignette_delivery_messages(order_id, status);

create unique index if not exists vignette_delivery_pending_unique
  on public.vignette_delivery_messages(order_id)
  where status in ('pending','sending','sent');

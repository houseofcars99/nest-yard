insert into storage.buckets (id, name, public)
values ('vignettes', 'vignettes', false)
on conflict (id) do update set public = false;

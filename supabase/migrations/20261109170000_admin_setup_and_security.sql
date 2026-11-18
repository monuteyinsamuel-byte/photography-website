create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete restrict,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table public.setup_state (
  id boolean primary key default true check (id),
  admin_user_id uuid unique references auth.users(id) on delete restrict,
  claimed_at timestamptz
);

insert into public.setup_state (id) values (true);

create or replace function public.is_current_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, pg_temp
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

create or replace function public.is_admin_setup_available()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, pg_temp
as $$
  select exists (
    select 1
    from public.setup_state
    where id = true and admin_user_id is null
  );
$$;

create or replace function public.claim_initial_admin(p_user_id uuid, p_email text)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
begin
  update public.setup_state
  set admin_user_id = p_user_id, claimed_at = now()
  where id = true and admin_user_id is null;

  if not found then
    return false;
  end if;

  insert into public.admin_users (user_id, email)
  values (p_user_id, lower(trim(p_email)));
  return true;
end;
$$;

revoke all on function public.is_current_admin() from public;
revoke all on function public.is_admin_setup_available() from public;
revoke all on function public.claim_initial_admin(uuid, text) from public, anon, authenticated;
grant execute on function public.is_current_admin() to anon, authenticated;
grant execute on function public.is_admin_setup_available() to anon, authenticated;
grant execute on function public.claim_initial_admin(uuid, text) to service_role;

create table public.site_settings (
  id uuid primary key default gen_random_uuid(),
  business_name text,
  photographer_name text,
  logo_path text,
  profile_image_path text,
  hero_image_path text,
  website_title text,
  tagline text,
  introduction text,
  about_text text,
  contact_email text,
  whatsapp_number text,
  location text,
  social_links jsonb,
  homepage_headline text,
  homepage_text text,
  website_description text,
  default_social_image_path text,
  canonical_url text,
  currency text,
  country text
);

create table public.gallery_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 120),
  slug text not null unique check (length(slug) between 1 and 140),
  sort_order integer not null default 0
);

create table public.portfolio_images (
  id uuid primary key default gen_random_uuid(),
  image_path text not null unique,
  caption text,
  alt_text text,
  category_id uuid references public.gallery_categories(id) on delete set null,
  sort_order integer not null default 0,
  is_published boolean not null default false
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 160),
  description text,
  pricing_type text not null check (pricing_type in ('fixed', 'quote')),
  price_amount numeric check (price_amount is null or price_amount >= 0),
  is_published boolean not null default false,
  sort_order integer not null default 0,
  check (pricing_type <> 'fixed' or price_amount is not null)
);

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null check (length(customer_name) between 1 and 120),
  rating integer not null check (rating between 1 and 5),
  review text not null check (length(review) between 1 and 5000),
  photographer_response text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table public.journal_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  cover_image_path text,
  excerpt text,
  content text not null default '',
  category text,
  publication_date date,
  seo_description text,
  is_published boolean not null default false
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (length(full_name) between 1 and 120),
  phone text not null check (length(phone) between 1 and 30),
  email text not null check (length(email) between 3 and 254),
  service_id uuid not null references public.services(id),
  preferred_date date not null,
  preferred_time time not null,
  event_location text not null check (length(event_location) between 1 and 180),
  event_description text not null check (length(event_description) between 1 and 3000),
  estimated_budget numeric check (estimated_budget is null or estimated_budget >= 0),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'rejected', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 120),
  email text not null check (length(email) between 3 and 254),
  phone text check (phone is null or length(phone) <= 30),
  message text not null check (length(message) between 1 and 5000),
  status text not null default 'new' check (status in ('new', 'read', 'archived')),
  created_at timestamptz not null default now()
);

create index portfolio_images_published_order_idx
  on public.portfolio_images (sort_order, id) where is_published;
create index services_published_order_idx
  on public.services (sort_order, name) where is_published;
create index testimonials_approved_created_idx
  on public.testimonials (created_at desc) where status = 'approved';
create index journal_articles_published_date_idx
  on public.journal_articles (publication_date DESC) where is_published;
create index bookings_status_date_idx on public.bookings (status, preferred_date);
create index enquiries_status_created_idx on public.enquiries (status, created_at desc);

alter table public.admin_users enable row level security;
alter table public.setup_state enable row level security;
alter table public.site_settings enable row level security;
alter table public.gallery_categories enable row level security;
alter table public.portfolio_images enable row level security;
alter table public.services enable row level security;
alter table public.testimonials enable row level security;
alter table public.journal_articles enable row level security;
alter table public.bookings enable row level security;
alter table public.enquiries enable row level security;

revoke all on public.admin_users, public.setup_state from anon, authenticated;
grant select, insert, update, delete on
  public.site_settings, public.gallery_categories, public.portfolio_images,
  public.services, public.testimonials, public.journal_articles,
  public.bookings, public.enquiries to anon, authenticated;

create policy "Public can read site settings"
  on public.site_settings for select to anon, authenticated using (true);
create policy "Public can read categories"
  on public.gallery_categories for select to anon, authenticated using (true);
create policy "Public can read published portfolio"
  on public.portfolio_images for select to anon, authenticated using (is_published);
create policy "Public can read published services"
  on public.services for select to anon, authenticated using (is_published);
create policy "Public can read approved testimonials"
  on public.testimonials for select to anon, authenticated using (status = 'approved');
create policy "Public can read published journal articles"
  on public.journal_articles for select to anon, authenticated using (is_published);
create policy "Public can submit pending testimonials"
  on public.testimonials for insert to anon, authenticated
  with check (status = 'pending' and photographer_response is null);
create policy "Public can submit pending bookings"
  on public.bookings for insert to anon, authenticated
  with check (
    status = 'pending'
    and exists (
      select 1
      from public.services s
      where s.id = bookings.service_id and s.is_published
    )
  );
create policy "Public can submit enquiries"
  on public.enquiries for insert to anon, authenticated
  with check (status = 'new');

create policy "Admins can manage site settings"
  on public.site_settings for all to authenticated
  using (public.is_current_admin()) with check (public.is_current_admin());
create policy "Admins can manage categories"
  on public.gallery_categories for all to authenticated
  using (public.is_current_admin()) with check (public.is_current_admin());
create policy "Admins can manage portfolio"
  on public.portfolio_images for all to authenticated
  using (public.is_current_admin()) with check (public.is_current_admin());
create policy "Admins can manage services"
  on public.services for all to authenticated
  using (public.is_current_admin()) with check (public.is_current_admin());
create policy "Admins can manage testimonials"
  on public.testimonials for all to authenticated
  using (public.is_current_admin()) with check (public.is_current_admin());
create policy "Admins can manage journal"
  on public.journal_articles for all to authenticated
  using (public.is_current_admin()) with check (public.is_current_admin());
create policy "Admins can manage bookings"
  on public.bookings for all to authenticated
  using (public.is_current_admin()) with check (public.is_current_admin());
create policy "Admins can manage enquiries"
  on public.enquiries for all to authenticated
  using (public.is_current_admin()) with check (public.is_current_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'business-images',
  'business-images',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

grant select on storage.objects to anon, authenticated;
grant insert, delete on storage.objects to authenticated;

create policy "Public can read referenced public images"
  on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'business-images'
    and (
      public.is_current_admin()
      or exists (
        select 1 from public.site_settings s
        where storage.objects.name in (
          s.logo_path, s.profile_image_path, s.hero_image_path,
          s.default_social_image_path
        )
      )
      or exists (
        select 1 from public.portfolio_images p
        where p.image_path = storage.objects.name and p.is_published
      )
      or exists (
        select 1 from public.journal_articles a
        where a.cover_image_path = storage.objects.name and a.is_published
      )
    )
  );
create policy "Admins can upload business images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'business-images' and public.is_current_admin());
create policy "Admins can delete unreferenced business images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'business-images'
    and public.is_current_admin()
    and not exists (
      select 1 from public.site_settings s
      where storage.objects.name in (
        s.logo_path, s.profile_image_path, s.hero_image_path,
        s.default_social_image_path
      )
    )
    and not exists (
      select 1
      from public.portfolio_images p
      where p.image_path = storage.objects.name
    )
    and not exists (
      select 1
      from public.journal_articles a
      where a.cover_image_path = storage.objects.name
    )
  );

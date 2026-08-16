-- BlueCurious relational schema
create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  price numeric(12,2) not null default 0 check (price >= 0),
  materials text,
  care_instructions text,
  production_time text,
  shipping_info text,
  returns_info text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  alt_text text,
  sort_order int not null default 0
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  color text,
  size text,
  sku text unique,
  inventory integer not null default 0 check (inventory >= 0),
  price_override numeric(12,2) check (price_override >= 0)
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text,
  full_name text not null,
  phone text not null,
  address_line text not null,
  city text not null,
  state text not null,
  pin_code text not null,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  order_number text not null unique,
  status text not null default 'pending' check (status in ('pending','paid','processing','shipped','delivered','cancelled','refunded')),
  subtotal numeric(12,2) not null default 0,
  shipping numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  razorpay_order_id text,
  razorpay_payment_id text,
  shipping_address jsonb,
  created_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null,
  variant_label text,
  unit_price numeric(12,2) not null,
  quantity integer not null check (quantity > 0)
);

create table public.wishlists (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  title text,
  body text,
  verified_purchase boolean not null default false,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.custom_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  product_type text not null,
  preferred_color text,
  size text,
  preferred_design text,
  budget numeric(12,2),
  deadline date,
  notes text,
  reference_path text,
  status text not null default 'new' check (status in ('new','reviewing','quoted','accepted','in_progress','completed','declined')),
  created_at timestamptz not null default now()
);

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null check (discount_type in ('percentage','fixed')),
  discount_value numeric(12,2) not null check (discount_value >= 0),
  minimum_order numeric(12,2) not null default 0,
  max_uses integer,
  used_count integer not null default 0,
  active boolean not null default true,
  expires_at timestamptz
);

-- Updated-at helper
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger products_updated_at before update on public.products
for each row execute function public.set_updated_at();

-- Profile creation
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name) values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.wishlists enable row level security;
alter table public.reviews enable row level security;
alter table public.custom_orders enable row level security;
alter table public.coupons enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles where id=auth.uid() and role='admin');
$$;

create policy "public read published products" on public.products for select using (published or public.is_admin());
create policy "public read categories" on public.categories for select using (true);
create policy "public read product images" on public.product_images for select using (exists(select 1 from public.products p where p.id=product_id and (p.published or public.is_admin())));
create policy "public read product variants" on public.product_variants for select using (exists(select 1 from public.products p where p.id=product_id and (p.published or public.is_admin())));

create policy "admins manage categories" on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage products" on public.products for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage images" on public.product_images for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage variants" on public.product_variants for all using (public.is_admin()) with check (public.is_admin());

create policy "users own profile" on public.profiles for select using (auth.uid()=id or public.is_admin());
create policy "users update profile" on public.profiles for update using (auth.uid()=id or public.is_admin());

create policy "users own addresses" on public.addresses for all using (auth.uid()=user_id or public.is_admin()) with check (auth.uid()=user_id or public.is_admin());
create policy "users own orders" on public.orders for select using (auth.uid()=user_id or public.is_admin());
create policy "admins manage orders" on public.orders for update using (public.is_admin()) with check (public.is_admin());
create policy "users own order items" on public.order_items for select using (exists(select 1 from public.orders o where o.id=order_id and (o.user_id=auth.uid() or public.is_admin())));

create policy "users own wishlist" on public.wishlists for all using (auth.uid()=user_id or public.is_admin()) with check (auth.uid()=user_id or public.is_admin());

create policy "public read approved reviews" on public.reviews for select using (approved or user_id=auth.uid() or public.is_admin());
create policy "users create reviews" on public.reviews for insert with check (auth.uid()=user_id);
create policy "admins moderate reviews" on public.reviews for all using (public.is_admin()) with check (public.is_admin());

create policy "users own custom orders" on public.custom_orders for select using (auth.uid()=user_id or public.is_admin());
create policy "users create custom orders" on public.custom_orders for insert with check (auth.uid()=user_id);
create policy "admins manage custom orders" on public.custom_orders for update using (public.is_admin()) with check (public.is_admin());

create policy "admins manage coupons" on public.coupons for all using (public.is_admin()) with check (public.is_admin());
create policy "public read active coupons" on public.coupons for select using (active=true or public.is_admin());

-- IMPORTANT:
-- Do not expose Razorpay secret keys in this Vite app.
-- Create Razorpay orders and verify signatures in a server/Edge Function.
-- Add storage buckets for product-images and custom-references with policies
-- that allow public read only for published product images and private user/admin access
-- for custom reference files.

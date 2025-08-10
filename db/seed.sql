
create table if not exists public.funds (
  isin text,
  name text not null,
  company text,
  category text,
  nisa_tsumitate boolean default false,
  nisa_growth boolean default false,
  primary key (isin, name)
);
create table if not exists public.fund_sources (
  isin text primary key,
  csv_url text not null,
  encoding text,
  date_col text,
  nav_col text,
  dist_col text
);
create table if not exists public.fund_nav (
  isin text not null,
  date date not null,
  nav numeric not null,
  dist numeric default 0,
  primary key (isin, date)
);
create table if not exists public.fund_metrics (
  isin text primary key,
  asof date,
  ret_1y numeric,
  ret_3y numeric,
  ret_5y numeric,
  vol_3y numeric,
  mdd_3y numeric
);
create table if not exists public.user_profiles (
  device_id text primary key,
  age_group text,
  updated_at timestamp with time zone default now()
);
create table if not exists public.portfolios (
  device_id text primary key,
  alloc jsonb not null,
  risk text,
  updated_at timestamp with time zone default now()
);

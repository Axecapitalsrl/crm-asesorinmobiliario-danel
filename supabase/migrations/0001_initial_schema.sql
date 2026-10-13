-- Initial schema for private single-agent real estate CRM.
-- Execute once in a new Supabase project via SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default 'Danel',
  role text not null default 'user' check (role in ('owner','user')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_crm_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'owner'
      and p.is_active = true
  );
$$;
revoke all on function public.is_crm_owner() from public;
grant execute on function public.is_crm_owner() to authenticated;

create table if not exists public.pipeline_stages (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 color text not null default '#315efb' check (color ~ '^#[0-9A-Fa-f]{6}$'),
 position integer not null default 0,
 is_won boolean not null default false,
 is_lost boolean not null default false,
 is_active boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check (not (is_won and is_lost))
);

create table if not exists public.leads (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 phone text,
 email text,
 lead_type text not null default 'buyer' check (lead_type in ('buyer','seller','investor','renter','owner','other')),
 source text not null default 'manual' check (source in ('manual','referral','social_media','portal','website','remax','other')),
 status text not null default 'active' check (status in ('active','won','lost','archived')),
 stage_id uuid references public.pipeline_stages(id) on delete set null,
 budget_min numeric(14,2) check (budget_min is null or budget_min >= 0),
 budget_max numeric(14,2) check (budget_max is null or budget_max >= 0),
 estimated_value numeric(14,2) check (estimated_value is null or estimated_value >= 0),
 notes text,
 next_follow_up_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check (budget_min is null or budget_max is null or budget_max >= budget_min)
);

create table if not exists public.properties (
 id uuid primary key default gen_random_uuid(),
 title text not null,
 property_type text not null default 'apartment' check (property_type in ('house','apartment','land','commercial','office','other')),
 status text not null default 'available' check (status in ('available','reserved','sold','rented','inactive')),
 listing_price numeric(14,2) check (listing_price is null or listing_price >= 0),
 currency text not null default 'USD' check (currency in ('USD','BOB','ARS')),
 address text,
 neighborhood text,
 city text,
 bedrooms integer check (bedrooms is null or bedrooms >= 0),
 bathrooms numeric(4,1) check (bathrooms is null or bathrooms >= 0),
 area_m2 numeric(12,2) check (area_m2 is null or area_m2 >= 0),
 description text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.lead_properties (
 lead_id uuid not null references public.leads(id) on delete cascade,
 property_id uuid not null references public.properties(id) on delete cascade,
 relationship text not null default 'interested' check (relationship in ('interested','offered','visited','offer_made','purchased','rejected')),
 notes text,
 created_at timestamptz not null default now(),
 primary key (lead_id, property_id)
);

create table if not exists public.activities (
 id uuid primary key default gen_random_uuid(),
 lead_id uuid references public.leads(id) on delete cascade,
 activity_type text not null check (activity_type in ('call','message','meeting','property_visit','note','stage_change','email','task','other')),
 subject text,
 notes text,
 occurred_at timestamptz not null default now(),
 created_at timestamptz not null default now()
);

create table if not exists public.tasks (
 id uuid primary key default gen_random_uuid(),
 title text not null,
 description text,
 lead_id uuid references public.leads(id) on delete set null,
 due_at timestamptz,
 status text not null default 'pending' check (status in ('pending','in_progress','completed','cancelled')),
 priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
 completed_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.goals (
 id uuid primary key default gen_random_uuid(),
 metric_key text not null check (metric_key in ('contacts','appointments','visits','closings','revenue')),
 period text not null check (period in ('daily','weekly','monthly')),
 target_value numeric(14,2) not null check (target_value >= 0),
 starts_on date not null default current_date,
 ends_on date,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check (ends_on is null or ends_on >= starts_on)
);

create table if not exists public.custom_fields (
 id uuid primary key default gen_random_uuid(),
 entity_type text not null check (entity_type in ('lead','property')),
 name text not null,
 field_key text not null,
 field_type text not null check (field_type in ('text','number','date','boolean','select','textarea')),
 options jsonb not null default '[]'::jsonb,
 is_required boolean not null default false,
 position integer not null default 0,
 is_active boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(entity_type, field_key)
);

create table if not exists public.lead_field_values (
 id uuid primary key default gen_random_uuid(),
 lead_id uuid not null references public.leads(id) on delete cascade,
 field_id uuid not null references public.custom_fields(id) on delete cascade,
 value jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(lead_id, field_id)
);

create table if not exists public.property_field_values (
 id uuid primary key default gen_random_uuid(),
 property_id uuid not null references public.properties(id) on delete cascade,
 field_id uuid not null references public.custom_fields(id) on delete cascade,
 value jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(property_id, field_id)
);

create table if not exists public.stage_history (
 id uuid primary key default gen_random_uuid(),
 lead_id uuid not null references public.leads(id) on delete cascade,
 from_stage_id uuid references public.pipeline_stages(id) on delete set null,
 to_stage_id uuid references public.pipeline_stages(id) on delete set null,
 changed_at timestamptz not null default now()
);

create index if not exists idx_leads_stage on public.leads(stage_id);
create index if not exists idx_leads_created_at on public.leads(created_at desc);
create index if not exists idx_leads_follow_up on public.leads(next_follow_up_at);
create index if not exists idx_tasks_due_status on public.tasks(status, due_at);
create index if not exists idx_activities_occurred on public.activities(occurred_at desc);
create index if not exists idx_stage_history_lead on public.stage_history(lead_id, changed_at desc);

-- Profile rows are provisioned from auth.users (no public signup/profile insertion).
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
 insert into public.profiles(id, full_name, role, is_active)
 values (new.id, coalesce(new.raw_user_meta_data->>'full_name','Agente'), 'user', false)
 on conflict (id) do nothing;
 return new;
end;
$$;
drop trigger if exists on_auth_user_created_crm on auth.users;
create trigger on_auth_user_created_crm after insert on auth.users
for each row execute function public.handle_new_auth_user();

alter table public.profiles enable row level security;
alter table public.pipeline_stages enable row level security;
alter table public.leads enable row level security;
alter table public.properties enable row level security;
alter table public.lead_properties enable row level security;
alter table public.activities enable row level security;
alter table public.tasks enable row level security;
alter table public.goals enable row level security;
alter table public.custom_fields enable row level security;
alter table public.lead_field_values enable row level security;
alter table public.property_field_values enable row level security;
alter table public.stage_history enable row level security;

drop policy if exists "owner reads own profile" on public.profiles;
create policy "owner reads own profile" on public.profiles for select to authenticated
using (id = (select auth.uid()) and public.is_crm_owner());

-- Profile role/activation are managed only via trusted SQL/dashboard, not app clients.
drop policy if exists "owner updates own profile" on public.profiles;

do $$
declare t text;
begin
 foreach t in array array['pipeline_stages','leads','properties','lead_properties','activities','tasks','goals','custom_fields','lead_field_values','property_field_values','stage_history']
 loop
  execute format('drop policy if exists "owner manages %1$s" on public.%1$I', t);
  execute format('create policy "owner manages %1$s" on public.%1$I for all to authenticated using (public.is_crm_owner()) with check (public.is_crm_owner())', t);
 end loop;
end $$;

insert into public.pipeline_stages(name,color,position,is_won,is_lost)
select v.name,v.color,v.position,v.is_won,v.is_lost
from (values
 ('Nuevo lead','#64748b',1,false,false),
 ('Contactado','#3b82f6',2,false,false),
 ('En seguimiento','#8b5cf6',3,false,false),
 ('Cita concertada','#0d9488',4,false,false),
 ('Visita realizada','#0891b2',5,false,false),
 ('Negociación','#d97706',6,false,false),
 ('Cerrado ganado','#16a34a',7,true,false),
 ('Cerrado perdido','#e11d48',8,false,true)
) as v(name,color,position,is_won,is_lost)
where not exists (select 1 from public.pipeline_stages);

-- AFTER creating your user in Authentication > Users:
-- Replace the UUID below with your actual auth.users id, then execute this separately:
-- update public.profiles set full_name='Danel', role='owner', is_active=true where id='YOUR-AUTH-USER-UUID'::uuid;

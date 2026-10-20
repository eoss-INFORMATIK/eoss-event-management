-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name varchar(255) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ---------------------------------------------------------------------------
-- organization users
-- ---------------------------------------------------------------------------

create table public.organization_user (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  foreign key (organization_id) references public.organizations(id),
  foreign key (user_id) references auth.users(id),
  UNIQUE(organization_id, user_id),
  UNIQUE(user_id)
);

  -- ---------------------------------------------------------------------------
  -- profiles
  -- ---------------------------------------------------------------------------

  create table public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    name text,
    email text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  -- ---------------------------------------------------------------------------
  -- RLS Organization
  -- ---------------------------------------------------------------------------

  alter table public.organizations enable row level security;

  create policy "Organizations can be selected by organization_user"
    on public.organizations for select
    to authenticated
    using (exists (select 1 from public.organization_user where organization_id = organizations.id and user_id = (select auth.uid())));

  -- organizations: any authenticated user may create, only organization_users may change or delete
  create policy "Organizations can be created by authenticated users"
    on public.organizations for insert
    to authenticated
    with check (true);

  create policy "Organizations can be updated by organization users"
    on public.organizations for update
    to authenticated
    using (exists (select 1 from public.organization_user where organization_id = organizations.id and user_id = (select auth.uid())));

  create policy "Organizations can be deleted by organization users"
      on public.organizations for delete
      to authenticated
      using (exists (select 1 from public.organization_user where organization_id = organizations.id and organization_user.user_id = (select auth.uid())));


-- ---------------------------------------------------------------------------
-- RLS Organization_User
-- ---------------------------------------------------------------------------
alter table public.organization_user enable row level security;

create policy "Organization users can be selected by admins"
  on public.organization_user for select
  to authenticated
  using (organization_user.user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- RLS Profiles
-- ---------------------------------------------------------------------------

  alter table public.profiles enable row level security;

  create policy "profiles can be selected by user"
    on public.profiles for select
    to authenticated
    using (id = (select auth.uid()));

  create policy "profiles can be created by authenticated users"
    on public.profiles for insert
    to authenticated
    with check (id = (select auth.uid()));

  create policy "Profiles can be updated or deleted by itself"
    on public.profiles for update
    to authenticated
    using (id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_organization_user_function() RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS
$BODY$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'auth.uid() ist null organizations kann nur mit angemeldeter Session angelegt werden';
    END IF;
    INSERT INTO
        public.organization_user(organization_id, user_id)
        VALUES(new.id, (select auth.uid()));
    RETURN new;
END;
$BODY$
language plpgsql;


create trigger set_organization_user
  after insert on public.organizations
  for each row
  execute function public.set_organization_user_function();

create trigger organization_set_updated_at
    before update on public.organizations
    for each row execute function public.set_updated_at();

create trigger profile_set_updated_at
    before update on public.profiles
    for each row execute function public.set_updated_at();

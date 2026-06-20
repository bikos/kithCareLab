-- 1. Create Organizations Table
create table if not exists public.organizations (
  id uuid not null default gen_random_uuid() primary key,
  name text not null,
  type text default 'care_center', -- 'care_center', 'hospice', 'home_health', etc.
  address text,
  city text,
  state text,
  zip_code text,
  phone text,
  email text,
  subscription_plan text default 'basic',
  created_at timestamptz default now()
);

-- 2. Organization Members (Links Profiles to Organizations with Roles)
create table if not exists public.organization_members (
  id uuid not null default gen_random_uuid() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  role text check (role in ('admin', 'nurse', 'staff')) not null,
  created_at timestamptz default now(),
  unique(organization_id, profile_id)
);

-- 3. Care Assignments (Links Staff to Individuals specifically)
-- Useful if a nurse is only assigned to specific patients, not all in the org.
create table if not exists public.care_assignments (
  id uuid not null default gen_random_uuid() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  staff_id uuid references public.profiles(id) on delete cascade not null, -- Must be a member of the org
  individual_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(staff_id, individual_id)
);

-- 4. Update Profiles Table
-- Add organization_id to profiles to link patients/residents directly to a facility.
alter table public.profiles 
add column if not exists organization_id uuid references public.organizations(id) on delete set null;


-- 5. Enable RLS
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.care_assignments enable row level security;

-- 6. RLS Policies

-- ORGANIZATIONS
-- Members can view their own organization
create policy "Members can view own organization" on public.organizations
  for select using (
    exists (
      select 1 from public.organization_members
      where organization_id = organizations.id
      and profile_id = public.get_current_profile_id()
    )
  );

-- Only Admins can update their organization
create policy "Admins can update own organization" on public.organizations
  for update using (
    exists (
      select 1 from public.organization_members
      where organization_id = organizations.id
      and profile_id = public.get_current_profile_id()
      and role = 'admin'
    )
  );

-- ORGANIZATION MEMBERS
-- Members can view other members in the same organization
create policy "Members can view org colleagues" on public.organization_members
  for select using (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = organization_members.organization_id
      and om.profile_id = get_current_profile_id()
    )
  );

-- Admins can manage members
create policy "Admins can manage members" on public.organization_members
  for all using (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = organization_members.organization_id
      and om.profile_id = get_current_profile_id()
      and om.role = 'admin'
    )
  );

-- CARE ASSIGNMENTS
-- Members can view assignments in their org
create policy "Members can view org assignments" on public.care_assignments
  for select using (
    exists (
      select 1 from public.organization_members
      where organization_id = care_assignments.organization_id
      and profile_id = public.get_current_profile_id()
    )
  );

-- Admins can manage assignments
create policy "Admins can manage assignments" on public.care_assignments
  for all using (
    exists (
      select 1 from public.organization_members
      where organization_id = care_assignments.organization_id
      and profile_id = public.get_current_profile_id()
      and role = 'admin'
    )
  );

-- UPDATED POLICY FOR PROFILES
-- Organization Members can view profiles (patients) that belong to their organization
create policy "Org members can view org patients" on public.profiles
  for select using (
    organization_id is not null 
    and exists (
      select 1 from public.organization_members
      where organization_id = profiles.organization_id
      and profile_id = public.get_current_profile_id()
    )
  );

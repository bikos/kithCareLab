-- RESET SCHEMA (CAUTION: DELETES ALL DATA)
drop schema if exists public cascade;
create schema public;
grant all on schema public to postgres;
grant all on schema public to public;

-- Enable necessary extensions
create extension if not exists "pgcrypto";

-- 1. Profiles (Decoupled from Auth)
create table public.profiles (
  id uuid not null default gen_random_uuid() primary key,
  auth_id uuid references auth.users unique, -- Nullable: Only Caregivers/Family have this
  full_name text not null,
  first_name text,
  last_name text,
  date_of_birth date,
  phone text,
  address text,
  city text,
  state text,
  zip_code text,
  medical_notes text,
  avatar_url text,
  sex text check (sex in ('male', 'female', 'other')),
  role text check (role in ('caregiver', 'individual')) not null,
  access_code text unique, -- For inviting others to view this profile (only for individuals)
  is_super_admin boolean default false, -- Platform Owner / God Mode
  -- Legal & End of Life
  dnr_status boolean default false,
  dnr_document_url text,
  living_will_status boolean default false,
  living_will_document_url text,
  poa_name text,
  poa_phone text,
  poa_email text,
  end_of_life_wishes text,
  email text,
  created_at timestamptz default now()
);

-- 2. Care Relationships (Caregiver -> Individual)
create table public.care_relationships (
  id uuid not null default gen_random_uuid() primary key,
  caregiver_id uuid references public.profiles(id) not null,
  individual_id uuid references public.profiles(id) not null,
  relationship_role text check (relationship_role in ('owner', 'editor', 'viewer')) default 'owner',
  status text check (status in ('active')) default 'active',
  created_at timestamptz default now(),
  unique(caregiver_id, individual_id)
);

-- 3. Journal Entries
create table public.journal_entries (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id), -- The Individual this entry is about (NULL for personal journals)
  created_by uuid references public.profiles(id) not null, -- The Caregiver who wrote it
  content text,
  mood text, -- Mood: happy, sad, anxious, energetic, neutral, etc.
  photo_url text, -- URL to attached photo
  caption text, -- Caption for the photo
  is_personal boolean default false, -- True if this is a personal caregiver journal
  created_at timestamptz default now()
);

-- 4. Clinicians (must be before medications due to FK reference)
create table public.clinicians (
  id uuid not null default gen_random_uuid() primary key,
  individual_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  specialty text, -- e.g., 'PCP', 'Cardiology', 'Neurology'
  phone text,
  email text,
  address text,
  notes text,
  created_at timestamptz default now()
);

-- 5. Medications
create table public.medications (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null, -- The Individual taking the med
  name text not null,
  dosage text,
  frequency text,
  scheduled_time time, -- Time of day medication should be taken
  scheduled_days text[], -- Days medication should be taken (e.g., ['Monday', 'Tuesday'] or ['Daily'])
  instructions text, -- Special instructions (e.g., "Take with food", "Take before bed")
  prescribed_by text, -- Doctor or prescriber name
  clinician_id uuid references public.clinicians(id), -- Link to structured clinician record
  created_at timestamptz default now()
);

-- 6. Medication Logs
create table public.medication_logs (
  id uuid not null default gen_random_uuid() primary key,
  medication_id uuid references public.medications(id) not null,
  taken_at timestamptz default now(),
  status text check (status in ('taken', 'missed', 'skipped')),
  logged_by uuid references public.profiles(id), -- The Caregiver who logged it
  notes text -- Optional notes about administration
);

-- 7. Contacts (General Contacts)
create table public.contacts (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null, -- The Individual who has this contact
  name text not null,
  phone text,
  role text,
  photo_url text,
  created_at timestamptz default now()
);

-- 8. Documents
create table public.documents (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null, -- The Individual who owns this doc
  title text not null,
  file_url text not null,
  category text,
  created_at timestamptz default now()
);

-- 9. Daily Care Logs
create table public.daily_care_logs (
    id uuid not null default gen_random_uuid() primary key,
    individual_id uuid references public.profiles(id) on delete cascade,
    created_by uuid references public.profiles(id) on delete cascade,
    log_date date not null default current_date,
    
    -- Sleep Metrics
    sleep_hours numeric(4,1),
    wake_time time,
    bed_time time,
    sleep_quality text check (sleep_quality in ('good', 'fair', 'poor', 'interrupted')),
    
    -- ADLs & Care
    mood text, -- Overall mood for the day
    hydration_level text check (hydration_level in ('low', 'medium', 'high')),

    
    -- Notes
    -- ADL Tracking (added via migration)
    adl_bathing text CHECK (adl_bathing IN ('independent', 'assisted', 'dependent', 'not_applicable')),
    adl_dressing text CHECK (adl_dressing IN ('independent', 'assisted', 'dependent', 'not_applicable')),
    adl_toileting text CHECK (adl_toileting IN ('independent', 'assisted', 'dependent', 'not_applicable')),
    adl_mobility text CHECK (adl_mobility IN ('independent', 'assisted', 'dependent', 'not_applicable')),
    adl_feeding text CHECK (adl_feeding IN ('independent', 'assisted', 'dependent', 'not_applicable')),

    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(individual_id, log_date) -- One log per day per individual
);

-- 10. Work Notes
create table public.work_notes (
  id uuid not null default gen_random_uuid() primary key,
  individual_id uuid references public.profiles(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  content text not null,
  category text check (category in ('observation', 'update', 'coordination', 'concern', 'general')),
  priority text check (priority in ('low', 'normal', 'high', 'urgent')) default 'normal',
  is_resolved boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 11. Emergency Contacts
create table public.emergency_contacts (
  id uuid not null default gen_random_uuid() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  phone text,
  email text,
  relationship text,
  is_primary boolean default false,
  created_at timestamptz default now()
);

-- 12. Dietary Logs
create table public.dietary_logs (
  id uuid not null default gen_random_uuid() primary key,
  individual_id uuid references public.profiles(id) on delete cascade not null,
  created_by uuid references public.profiles(id) on delete cascade not null,
  meal_type text check (meal_type in ('Breakfast', 'Lunch', 'Dinner', 'Snack')),
  appetite_level text check (appetite_level in ('Good', 'Fair', 'Poor', 'Refused')),
  notes text,
  logged_at timestamptz default now(),
  created_at timestamptz default now()
);

-- 13. Clinical Visits
create table public.clinical_visits (
  id uuid not null default gen_random_uuid() primary key,
  clinician_id uuid references public.clinicians(id) on delete cascade not null,
  individual_id uuid references public.profiles(id) on delete cascade not null,
  visit_date date not null,
  reason text,
  notes text,
  follow_up_date date,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.care_relationships enable row level security;
alter table public.journal_entries enable row level security;
alter table public.medications enable row level security;
alter table public.medication_logs enable row level security;
alter table public.contacts enable row level security;
alter table public.documents enable row level security;
alter table public.daily_care_logs enable row level security;
alter table public.work_notes enable row level security;
alter table public.emergency_contacts enable row level security;
alter table public.emergency_contacts enable row level security;
alter table public.dietary_logs enable row level security;
alter table public.clinicians enable row level security;
alter table public.clinical_visits enable row level security;

-- Grant access to tables
grant all on all tables in schema public to postgres, anon, authenticated, service_role;
grant all on all sequences in schema public to postgres, anon, authenticated, service_role;
grant all on all routines in schema public to postgres, anon, authenticated, service_role;

-- Explicitly grant access to new tables (redundant with 'all tables' but good for clarity)
grant all on table public.clinicians to postgres, anon, authenticated, service_role;
grant all on table public.clinical_visits to postgres, anon, authenticated, service_role;

-- RLS Policies

-- Helper function to get current profile id
create or replace function public.get_current_profile_id()
returns uuid
language plpgsql
security definer set search_path = public
stable
as $$
declare
  profile_id uuid;
begin
  select id into profile_id from public.profiles where auth_id = auth.uid();
  return profile_id;
end;
$$;

-- 1. Profiles
-- Caregivers can see their own profile
create policy "Caregivers can view own profile" on public.profiles
  for select using (auth_id = auth.uid());

-- Caregivers can update their own profile
create policy "Caregivers can update own profile" on public.profiles
  for update using (auth_id = auth.uid());

-- Caregivers can insert their own profile (Fallback if trigger fails)
create policy "Caregivers can insert own profile" on public.profiles
  for insert with check (auth_id = auth.uid());

-- Caregivers can view managed profiles (Any role)
create policy "Caregivers can view managed profiles" on public.profiles
  for select using (
    exists (
      select 1 from public.care_relationships
      where caregiver_id = public.get_current_profile_id()
      and individual_id = profiles.id
    )
  );

-- Caregivers can insert new profiles (Individuals)
create policy "Caregivers can insert individuals" on public.profiles
  for insert with check (
    auth_id is null -- Ensure they aren't trying to hijack an auth user
    and role = 'individual'
  );
  
-- Caregivers can update managed profiles (Only Owners/Editors)
create policy "Caregivers can update managed profiles" on public.profiles
  for update using (
    exists (
      select 1 from public.care_relationships
      where caregiver_id = public.get_current_profile_id()
      and individual_id = profiles.id
      and relationship_role in ('owner', 'editor')
    )
  );

-- 2. Care Relationships
-- Caregivers can view their own relationships
create policy "Caregivers can view own relationships" on public.care_relationships
  for select using (caregiver_id = public.get_current_profile_id());

-- Caregivers can create relationships (when adding an individual or joining via code)
create policy "Caregivers can insert relationships" on public.care_relationships
  for insert with check (caregiver_id = public.get_current_profile_id());



-- 3. Data Tables (Journal, Meds, Contacts, Docs)
-- Policy: Caregiver can access if they manage the 'user_id' (Individual)

-- Journal
create policy "Caregivers view managed journal" on public.journal_entries
  for select using (
    -- Can view journals for individuals they manage
    exists (
      select 1 
      from public.care_relationships cr
      join public.profiles p on p.id = cr.caregiver_id
      where p.auth_id = auth.uid()
      and cr.individual_id = journal_entries.user_id
    )
    OR
    -- Can view their own personal journals
    (
        exists (
            select 1 from public.profiles p 
            where p.id = journal_entries.created_by 
            and p.auth_id = auth.uid()
        ) 
        and is_personal = true 
        and user_id is null
    )
  );

create policy "Caregivers insert managed journal" on public.journal_entries
  for insert with check (
    -- Can insert journals for individuals they manage (with edit permissions)
    (
      exists (
        select 1 
        from public.care_relationships cr
        join public.profiles p on p.id = cr.caregiver_id
        where p.auth_id = auth.uid()
        and cr.individual_id = journal_entries.user_id
        and cr.relationship_role in ('owner', 'editor')
      )
      and is_personal = false
    )
    OR
    -- Can insert their own personal journals
    (
        exists (
            select 1 from public.profiles p 
            where p.id = journal_entries.created_by 
            and p.auth_id = auth.uid()
        )
        and is_personal = true 
        and user_id is null
    )
  );

-- Medications
create policy "Caregivers view managed medications" on public.medications
  for select using (
    exists (
      select 1 
      from public.care_relationships cr
      join public.profiles p on p.id = cr.caregiver_id
      where p.auth_id = auth.uid()
      and cr.individual_id = medications.user_id
    )
  );

create policy "Caregivers insert managed medications" on public.medications
  for insert with check (
    exists (
      select 1 
      from public.care_relationships cr
      join public.profiles p on p.id = cr.caregiver_id
      where p.auth_id = auth.uid()
      and cr.individual_id = medications.user_id
      and cr.relationship_role in ('owner', 'editor')
    )
  );

-- Medication Logs
create policy "Caregivers view managed med logs" on public.medication_logs
  for select using (
    exists (
      select 1 
      from public.medications m
      join public.care_relationships cr on cr.individual_id = m.user_id
      join public.profiles p on p.id = cr.caregiver_id
      where m.id = medication_logs.medication_id
      and p.auth_id = auth.uid()
    )
  );

create policy "Caregivers insert managed med logs" on public.medication_logs
  for insert with check (
    exists (
      select 1 
      from public.medications m
      join public.care_relationships cr on cr.individual_id = m.user_id
      join public.profiles p on p.id = cr.caregiver_id
      where m.id = medication_logs.medication_id
      and p.auth_id = auth.uid()
      and cr.relationship_role in ('owner', 'editor')
    )
  );

-- Contacts
create policy "Caregivers view managed contacts" on public.contacts
  for select using (
    exists (
      select 1 
      from public.care_relationships cr
      join public.profiles p on p.id = cr.caregiver_id
      where p.auth_id = auth.uid()
      and cr.individual_id = contacts.user_id
    )
  );

create policy "Caregivers insert managed contacts" on public.contacts
  for insert with check (
    exists (
      select 1 
      from public.care_relationships cr
      join public.profiles p on p.id = cr.caregiver_id
      where p.auth_id = auth.uid()
      and cr.individual_id = contacts.user_id
      and cr.relationship_role in ('owner', 'editor')
    )
  );

-- Documents
create policy "Caregivers view managed documents" on public.documents
  for select using (
    exists (
      select 1 
      from public.care_relationships cr
      join public.profiles p on p.id = cr.caregiver_id
      where p.auth_id = auth.uid()
      and cr.individual_id = documents.user_id
    )
  );

create policy "Caregivers insert managed documents" on public.documents
  for insert with check (
    exists (
      select 1 
      from public.care_relationships cr
      join public.profiles p on p.id = cr.caregiver_id
      where p.auth_id = auth.uid()
      and cr.individual_id = documents.user_id
      and cr.relationship_role in ('owner', 'editor')
    )
  );

-- Emergency Contacts
create policy "Caregivers view managed emergency contacts" on public.emergency_contacts
  for select using (
    exists (
      select 1 
      from public.care_relationships cr
      join public.profiles p on p.id = cr.caregiver_id
      where p.auth_id = auth.uid()
      and cr.individual_id = emergency_contacts.profile_id
    )
  );

create policy "Caregivers insert managed emergency contacts" on public.emergency_contacts
  for insert with check (
    exists (
      select 1 
      from public.care_relationships cr
      join public.profiles p on p.id = cr.caregiver_id
      where p.auth_id = auth.uid()
      and cr.individual_id = emergency_contacts.profile_id
      and cr.relationship_role in ('owner', 'editor')
    )
  );

create policy "Caregivers update managed emergency contacts" on public.emergency_contacts
  for update using (
    exists (
      select 1 
      from public.care_relationships cr
      join public.profiles p on p.id = cr.caregiver_id
      where p.auth_id = auth.uid()
      and cr.individual_id = emergency_contacts.profile_id
      and cr.relationship_role in ('owner', 'editor')
    )
  );

create policy "Caregivers delete managed emergency contacts" on public.emergency_contacts
  for delete using (
    exists (
      select 1 
      from public.care_relationships cr
      join public.profiles p on p.id = cr.caregiver_id
      where p.auth_id = auth.uid()
      and cr.individual_id = emergency_contacts.profile_id
      and cr.relationship_role in ('owner', 'editor')
    )
  );

-- Dietary Logs
create policy "Caregivers view managed dietary logs" on public.dietary_logs
  for select using (
    exists (
      select 1 
      from public.care_relationships cr
      join public.profiles p on p.id = cr.caregiver_id
      where p.auth_id = auth.uid()
      and cr.individual_id = dietary_logs.individual_id
    )
  );

create policy "Caregivers insert managed dietary logs" on public.dietary_logs
  for insert with check (
    exists (
      select 1 
      from public.care_relationships cr
      join public.profiles p on p.id = cr.caregiver_id
      where p.auth_id = auth.uid()
      and cr.individual_id = dietary_logs.individual_id
      and cr.relationship_role in ('owner', 'editor')
    )
  );

create policy "Caregivers update managed dietary logs" on public.dietary_logs
  for update using (
    exists (
      select 1 
      from public.care_relationships cr
      join public.profiles p on p.id = cr.caregiver_id
      where p.auth_id = auth.uid()
      and cr.individual_id = dietary_logs.individual_id
      and cr.relationship_role in ('owner', 'editor')
    )
  );

create policy "Caregivers delete managed dietary logs" on public.dietary_logs
  for delete using (
    exists (
      select 1 
      from public.care_relationships cr
      join public.profiles p on p.id = cr.caregiver_id
      where p.auth_id = auth.uid()
      and cr.individual_id = dietary_logs.individual_id
      and cr.relationship_role in ('owner', 'editor')
    )
  );


-- Trigger: Auto-create Caregiver Profile on Signup
create or replace function public.handle_new_caregiver()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  default_name text;
  meta_first_name text;
  meta_last_name text;
begin
  -- Try to get name from metadata, otherwise use part of email or default
  default_name := new.raw_user_meta_data ->> 'full_name';
  meta_first_name := new.raw_user_meta_data ->> 'first_name';
  meta_last_name := new.raw_user_meta_data ->> 'last_name';
  
  if default_name is null or default_name = '' then
    default_name := split_part(new.email, '@', 1); -- Default to part of email
  end if;
  
  if default_name is null or default_name = '' then
    default_name := 'Invited User';
  end if;

  insert into public.profiles (auth_id, full_name, first_name, last_name, role, avatar_url, email)
  values (
    new.id,
    default_name,
    meta_first_name,
    meta_last_name,
    'caregiver', -- Always 'caregiver' for signed-up users in this model
    '',
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_caregiver();

-- RPC: Create Individual (Atomic Profile + Relationship)
create or replace function public.create_individual(
  p_first_name text,
  p_last_name text,
  p_date_of_birth date default null,
  p_phone text default null,
  p_address text default null,
  p_city text default null,
  p_state text default null,
  p_zip_code text default null,
  p_emergency_contact_name text default null,
  p_emergency_contact_phone text default null,
  p_emergency_contact_email text default null,
  p_emergency_contact_relationship text default null,
  p_medical_notes text default null,
  p_sex text default null,
  p_avatar_url text default null,
  p_organization_id uuid default null -- NEW: Optional Organization ID
)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  current_caregiver_id uuid;
  new_profile_id uuid;
  new_access_code text;
  full_name_computed text;
  result json;
begin
  -- Get current caregiver ID
  select id into current_caregiver_id from public.profiles where auth_id = auth.uid();
  if current_caregiver_id is null then
    raise exception 'Caregiver profile not found';
  end if;

  -- Generate random 6-digit access code
  new_access_code := floor(100000 + random() * 900000)::text;
  
  -- Compute full name
  full_name_computed := trim(p_first_name || ' ' || p_last_name);

  -- Insert Profile
  insert into public.profiles (
    full_name, 
    first_name, 
    last_name, 
    date_of_birth, 
    phone, 
    address, 
    city, 
    state, 
    zip_code,
    medical_notes,
    sex,
    role, 
    access_code,
    avatar_url,
    organization_id -- NEW: Link to Organization
  )
  values (
    full_name_computed,
    p_first_name,
    p_last_name,
    p_date_of_birth,
    p_phone,
    p_address,
    p_city,
    p_state,
    p_zip_code,
    p_medical_notes,
    p_sex,
    'individual',
    new_access_code,
    p_avatar_url,
    p_organization_id
  )
  returning id into new_profile_id;

  -- Insert Relationship
  insert into public.care_relationships (caregiver_id, individual_id, relationship_role, status)
  values (current_caregiver_id, new_profile_id, 'owner', 'active');

  -- Insert Emergency Contact (if provided)
  if p_emergency_contact_name is not null then
    insert into public.emergency_contacts (
      profile_id, 
      name, 
      phone, 
      email, 
      relationship, 
      is_primary
    )
    values (
      new_profile_id,
      p_emergency_contact_name,
      p_emergency_contact_phone,
      p_emergency_contact_email,
      p_emergency_contact_relationship,
      true
    );
  end if;

  -- Return the new profile data
  select row_to_json(p) into result from public.profiles p where id = new_profile_id;
  return result;
end;
$$;
-- Daily Care Logs
create policy "Caregivers view managed daily logs" on public.daily_care_logs
  for select using (
    exists (
      select 1 
      from public.care_relationships cr
      join public.profiles p on p.id = cr.caregiver_id
      where p.auth_id = auth.uid()
      and cr.individual_id = daily_care_logs.individual_id
    )
  );

create policy "Caregivers insert managed daily logs" on public.daily_care_logs
  for insert with check (
    exists (
      select 1 
      from public.care_relationships cr
      join public.profiles p on p.id = cr.caregiver_id
      where p.auth_id = auth.uid()
      and cr.individual_id = daily_care_logs.individual_id
      and cr.relationship_role in ('owner', 'editor')
    )
  );

create policy "Caregivers update managed daily logs" on public.daily_care_logs
  for update using (
    exists (
      select 1 
      from public.care_relationships cr
      join public.profiles p on p.id = cr.caregiver_id
      where p.auth_id = auth.uid()
      and cr.individual_id = daily_care_logs.individual_id
      and cr.relationship_role in ('owner', 'editor')
    )
  );

create policy "Caregivers delete managed daily logs" on public.daily_care_logs
  for delete using (
    exists (
      select 1 
      from public.care_relationships cr
      join public.profiles p on p.id = cr.caregiver_id
      where p.auth_id = auth.uid()
      and cr.individual_id = daily_care_logs.individual_id
      and cr.relationship_role in ('owner', 'editor')
    )
  );
-- Work Notes Policies (using auth.uid() directly)
create policy "work_notes_select_policy" on public.work_notes
  for select using (
    exists (
      select 1 
      from public.care_relationships cr
      join public.profiles p on p.id = cr.caregiver_id
      where cr.individual_id = work_notes.individual_id
        and p.auth_id = auth.uid()
    )
  );

create policy "work_notes_insert_policy" on public.work_notes
  for insert with check (
    exists (
      select 1 
      from public.care_relationships cr
      join public.profiles p on p.id = cr.caregiver_id
      where cr.individual_id = work_notes.individual_id
        and p.auth_id = auth.uid()
    )
  );

create policy "work_notes_update_policy" on public.work_notes
  for update using (
    exists (
      select 1 
      from public.profiles p
      where p.id = work_notes.created_by
        and p.auth_id = auth.uid()
    )
  );

-- Policy 1: Caregivers can view work notes for managed individuals
create policy "Caregivers view work notes for managed individuals" on public.work_notes
  for select using (
    individual_id is not null
    and exists (
      select 1 from public.care_relationships
      where caregiver_id = public.get_current_profile_id()
      and individual_id = work_notes.individual_id
    )
  );





-- Policy 4: Creators can always view their own notes
create policy "Creators can view own work notes" on public.work_notes
  for select using (
    created_by = public.get_current_profile_id()
  );

create policy "work_notes_delete_policy" on public.work_notes
  for delete using (
    exists (
      select 1 
      from public.profiles p
      where p.id = work_notes.created_by
        and p.auth_id = auth.uid()
    )
  );

-- RPC: Join Care Team (Securely lookup by access code and create relationship)
create or replace function public.join_care_team(p_access_code text)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  current_caregiver_id uuid;
  target_profile_id uuid;
  existing_rel_id uuid;
  result json;
begin
  -- Get current caregiver ID
  select id into current_caregiver_id from public.profiles where auth_id = auth.uid();
  if current_caregiver_id is null then
    raise exception 'Caregiver profile not found';
  end if;

  -- Find target profile by access code
  select id into target_profile_id from public.profiles where access_code = p_access_code;
  if target_profile_id is null then
    raise exception 'Invalid access code';
  end if;

  -- Check if relationship already exists
  select id into existing_rel_id from public.care_relationships 
  where caregiver_id = current_caregiver_id and individual_id = target_profile_id;
  
  if existing_rel_id is not null then
    raise exception 'You are already a member of this care team';
  end if;

  -- Insert Relationship
  insert into public.care_relationships (caregiver_id, individual_id, relationship_role, status)
  values (current_caregiver_id, target_profile_id, 'viewer', 'active');

  -- Return the profile data
  select row_to_json(p) into result from public.profiles p where id = target_profile_id;
  return result;
end;
$$;

-- Clinicians Policies
create policy "Caregivers view managed clinicians" on public.clinicians
  for select using (
    exists (
      select 1 from public.care_relationships
      where caregiver_id = public.get_current_profile_id()
      and individual_id = clinicians.individual_id
    )
  );

create policy "Caregivers insert managed clinicians" on public.clinicians
  for insert with check (
    exists (
      select 1 from public.care_relationships
      where caregiver_id = public.get_current_profile_id()
      and individual_id = clinicians.individual_id
      and relationship_role in ('owner', 'editor')
    )
  );

create policy "Caregivers update managed clinicians" on public.clinicians
  for update using (
    exists (
      select 1 from public.care_relationships
      where caregiver_id = public.get_current_profile_id()
      and individual_id = clinicians.individual_id
      and relationship_role in ('owner', 'editor')
    )
  );

create policy "Caregivers delete managed clinicians" on public.clinicians
  for delete using (
    exists (
      select 1 from public.care_relationships
      where caregiver_id = public.get_current_profile_id()
      and individual_id = clinicians.individual_id
      and relationship_role in ('owner', 'editor')
    )
  );

-- Clinical Visits Policies
create policy "Caregivers view managed clinical visits" on public.clinical_visits
  for select using (
    exists (
      select 1 from public.care_relationships
      where caregiver_id = public.get_current_profile_id()
      and individual_id = clinical_visits.individual_id
    )
  );

create policy "Caregivers insert managed clinical visits" on public.clinical_visits
  for insert with check (
    exists (
      select 1 from public.care_relationships
      where caregiver_id = public.get_current_profile_id()
      and individual_id = clinical_visits.individual_id
      and relationship_role in ('owner', 'editor')
    )
  );

create policy "Caregivers update managed clinical visits" on public.clinical_visits
  for update using (
    exists (
      select 1 from public.care_relationships
      where caregiver_id = public.get_current_profile_id()
      and individual_id = clinical_visits.individual_id
      and relationship_role in ('owner', 'editor')
    )
  );

create policy "Caregivers delete managed clinical visits" on public.clinical_visits
  for delete using (
    exists (
      select 1 from public.care_relationships
      where caregiver_id = public.get_current_profile_id()
      and individual_id = clinical_visits.individual_id
      and relationship_role in ('owner', 'editor')
    )
  );

-- Storage Buckets
-- Create the storage bucket for documents
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

-- Set up RLS policies for the storage bucket
drop policy if exists "Authenticated users can upload documents" on storage.objects;
create policy "Authenticated users can upload documents"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'documents' );

drop policy if exists "Authenticated users can view documents" on storage.objects;
create policy "Authenticated users can view documents"
on storage.objects for select
to authenticated
using ( bucket_id = 'documents' );

-- Also ensure the avatars bucket exists (referenced in other parts of the app)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Authenticated users can upload avatars" on storage.objects;
create policy "Authenticated users can upload avatars"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'avatars' );

drop policy if exists "Public access to avatars" on storage.objects;
create policy "Public access to avatars"
on storage.objects for select
to public
using ( bucket_id = 'avatars' );

-- ==========================================
-- ORGANIZATION / FACILITY EXTENSION
-- ==========================================

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
  status text default 'active' check (status in ('active', 'inactive')) not null,
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

-- GRANT ACCESS TO NEW TABLES (Crucial step)
grant all on table public.organizations to postgres, anon, authenticated, service_role;
grant all on table public.organization_members to postgres, anon, authenticated, service_role;
grant all on table public.care_assignments to postgres, anon, authenticated, service_role;

-- 6. RLS Policies

-- Helper function to check membership without recursion (SECURITY DEFINER bypasses RLS)
create or replace function public.current_user_is_member_of(org_id uuid)
returns boolean
language plpgsql
security definer -- <== This breaks the infinite recursion
set search_path = public
stable
as $$
begin
  return exists (
    select 1 from public.organization_members
    where organization_id = org_id
    and profile_id = public.get_current_profile_id()
  );
end;
$$;

-- Helper function to check admin role without recursion
create or replace function public.current_user_is_org_admin(org_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  return exists (
    select 1 from public.organization_members
    where organization_id = org_id
    and profile_id = public.get_current_profile_id()
    and role = 'admin'
  );
end;
$$;


-- ORGANIZATIONS
-- Members can view their own organization (uses helper function to avoid recursion)
create policy "Members can view own organization" on public.organizations
  for select using (
    public.current_user_is_member_of(id)
  );

-- Only Admins can update their organization (uses helper function to avoid recursion)
create policy "Admins can update own organization" on public.organizations
  for update using (
    public.current_user_is_org_admin(id)
  );


-- ORGANIZATION MEMBERS
-- Users can see their own membership row (Base visibility)
create policy "Users can view own membership" on public.organization_members
  for select using (
    profile_id = public.get_current_profile_id()
  );

-- Members can view other members in the same organization (Uses function to avoid recursion)
create policy "Members can view org colleagues" on public.organization_members
  for select using (
    public.current_user_is_member_of(organization_id)
  );


-- Members can view their own membership (Required for Role Checks)
create policy "Members can view own membership" on public.organization_members
  for select using (
    profile_id = public.get_current_profile_id()
  );

-- Admins can manage members (Uses function to avoid recursion)
create policy "Admins can manage members" on public.organization_members
  for all using (
    public.current_user_is_org_admin(organization_id)
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
    )
  );

-- Organization Members can view other members (Staff) of their organization
create policy "Org members can view other org members" on public.profiles
  for select using (
    exists (
      select 1 from public.organization_members om_target
      join public.organization_members om_me on om_target.organization_id = om_me.organization_id
      where om_target.profile_id = profiles.id
      and om_me.profile_id = public.get_current_profile_id()
    )
  );

-- 
-- STAFF INVITES
--
create table organization_invites (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references organizations(id) on delete cascade not null,
  email text not null,
  role text not null check (role in ('admin', 'nurse', 'staff')),
  status text default 'pending' check (status in ('pending', 'accepted', 'expired')),
  invited_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(organization_id, email)
);

alter table public.organization_invites enable row level security;

-- Drop existing policy if it exists (for safety in replay, though this is schema definition)
-- create policy "Org admins can manage invites" ... replaced by:

create policy "Org admins can view invites"
  on public.organization_invites for select
  using (
    exists (
      select 1 from public.organization_members
      where organization_members.organization_id = organization_invites.organization_id
      and organization_members.profile_id = (select id from public.profiles where auth_id = auth.uid())
      and organization_members.role = 'admin'
    )
  );

create policy "Org admins can insert invites"
  on public.organization_invites for insert
  with check (
    exists (
      select 1 from public.organization_members
      where organization_members.organization_id = organization_invites.organization_id
      and organization_members.profile_id = (select id from public.profiles where auth_id = auth.uid())
      and organization_members.role = 'admin'
    )
  );

create policy "Org admins can delete invites"
  on public.organization_invites for delete
  using (
    exists (
      select 1 from public.organization_members
      where organization_members.organization_id = organization_invites.organization_id
      and organization_members.profile_id = (select id from public.profiles where auth_id = auth.uid())
      and organization_members.role = 'admin'
    )
  );

-- Trigger: Unified User Creation and Invite Handler
create or replace function public.handle_new_user_unified()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  new_profile_id uuid;
  default_name text;
  meta_first_name text;
  meta_last_name text;
  invite_record record;
begin
  -- A. Ensure Profile Exists
  select id into new_profile_id from public.profiles where auth_id = new.id;

  if new_profile_id is null then
      -- Log logic for profile creation
      default_name := new.raw_user_meta_data ->> 'full_name';
      meta_first_name := new.raw_user_meta_data ->> 'first_name';
      meta_last_name := new.raw_user_meta_data ->> 'last_name';
      
      if default_name is null or default_name = '' then
        default_name := split_part(new.email, '@', 1); 
      end if;
      if default_name is null or default_name = '' then
        default_name := 'Invited User';
      end if;

      insert into public.profiles (auth_id, full_name, first_name, last_name, role, avatar_url, email)
      values (
        new.id,
        default_name,
        meta_first_name,
        meta_last_name,
        'caregiver', 
        '',
        new.email
      ) returning id into new_profile_id;
  else
      -- Update email if profile already exists but email is null
      update public.profiles
      set email = new.email
      where id = new_profile_id and email is null;
  end if;

  -- B. Handle Invites (Only if Email is Confirmed)
  if new.email_confirmed_at is not null then
      for invite_record in 
        select * from public.organization_invites 
        where email = new.email 
        and status = 'pending'
      loop
        -- Check if already a member to avoid duplicates
        if not exists (select 1 from public.organization_members where organization_id = invite_record.organization_id and profile_id = new_profile_id) then
            insert into public.organization_members (organization_id, profile_id, role)
            values (
              invite_record.organization_id,
              new_profile_id,
              invite_record.role
            );
        end if;

        update public.organization_invites
        set status = 'accepted'
        where id = invite_record.id;
      end loop;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_auth_user_confirmed_invite on auth.users;
drop trigger if exists on_auth_user_unified on auth.users;

create trigger on_auth_user_unified
  after insert or update on auth.users
  for each row execute procedure public.handle_new_user_unified();

-- Grant permissions explicitly
grant all on table public.organization_invites to postgres, authenticated, service_role;

-- ==========================================
-- SUPER ADMIN POLICIES
-- ==========================================

-- Helper Function to avoid RLS recursion
create or replace function public.get_is_super_admin()
returns boolean
language plpgsql
security definer 
set search_path = public
stable
as $$
declare
  is_admin boolean;
begin
  select is_super_admin into is_admin from public.profiles where auth_id = auth.uid();
  return coalesce(is_admin, false);
end;
$$;

-- Organizations
create policy "Super Admins can manage organizations"
  on public.organizations for all
  using (
    public.get_is_super_admin()
  );

-- Organization Invites
create policy "Super Admins can manage organization invites"
  on public.organization_invites for all
  using (
    public.get_is_super_admin()
  );

-- Organization Members
create policy "Super Admins can manage organization members"
  on public.organization_members for all
  using (
    public.get_is_super_admin()
  );

-- Profiles (View All)
create policy "Super Admins can view all profiles"
  on public.profiles for select
  using (
    public.get_is_super_admin()
  );




-- 14. Shifts (Global Organization Scope)
create table public.shifts (
  id uuid not null default gen_random_uuid() primary key,
  caregiver_id uuid references public.profiles(id) on delete cascade not null,
  individual_id uuid references public.profiles(id) on delete cascade, -- Nullable for Global Shift
  organization_id uuid references public.organizations(id) on delete cascade,
  
  start_time timestamptz not null default now(),
  end_time timestamptz, -- NULL means active shift
  
  status text check (status in ('active', 'completed')) default 'active',
  
  -- Handoff Summary (Generated at end of shift)
  handoff_notes text,
  mood_summary text,
  meds_taken_count integer default 0,
  
  created_at timestamptz default now()
);

-- Enable RLS for Shifts
alter table public.shifts enable row level security;

-- Shifts Policies

-- A. CAREGIVERS: View/Manage accounts where they are the caregiver
create policy "Caregivers determine own shifts" on public.shifts
  for all using (
    caregiver_id = public.get_current_profile_id()
  );

-- B. ADMINS: View all shifts in their organization
create policy "Admins view org shifts" on public.shifts
  for select using (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = shifts.organization_id
      and om.profile_id = public.get_current_profile_id()
      and om.role = 'admin'
    )
  );

-- C. CO-WORKERS: View shifts from my organization (for handoff visibility)
create policy "Co-workers view org shifts" on public.shifts
  for select using (
    exists (
      select 1 from public.organization_members my_mem
      where my_mem.profile_id = public.get_current_profile_id()
      and my_mem.organization_id = shifts.organization_id
    )
  );

-- Grant Access
grant all on table public.shifts to postgres, anon, authenticated, service_role;
-- Migration: Family Access & Care Team Invites

-- 1. Family Invites Table
-- This table tracks invitations to non-staff members (Family, Friends) to view specific residents.
create table if not exists public.family_invites (
  id uuid not null default gen_random_uuid() primary key,
  individual_id uuid references public.profiles(id) on delete cascade not null,
  email text not null,
  role text check (role in ('editor', 'viewer')) not null default 'viewer',
  status text check (status in ('pending', 'accepted', 'expired')) default 'pending',
  invited_by uuid references auth.users(id),
  created_at timestamptz default now(),
  unique(individual_id, email)
);

alter table public.family_invites enable row level security;

-- RLS: Manage invites if you are an Owner/Editor of the resident OR an Org Admin for the resident
create policy "Caregivers manage family invites" on public.family_invites
  for all using (
    exists (
      select 1 from public.care_relationships cr
      where cr.individual_id = family_invites.individual_id
      and cr.caregiver_id = (select id from public.profiles where auth_id = auth.uid())
      and cr.relationship_role in ('owner', 'editor')
    )
    OR
    exists (
      select 1 
      from public.profiles target
      join public.organization_members my_mem on target.organization_id = my_mem.organization_id
      where target.id = family_invites.individual_id
      and my_mem.profile_id = (select id from public.profiles where auth_id = auth.uid())
      and my_mem.role = 'admin'
    )
  );

-- 2. RPC: Create Family Invite
-- Securely creates an invite record.
create or replace function public.create_family_invite(
  p_individual_id uuid,
  p_email text,
  p_role text
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_sender_id uuid;
begin
  -- Validate permission: Must be Owner/Editor or Org Admin
  if not exists (
    select 1 from public.care_relationships cr
    join public.profiles p on p.id = cr.caregiver_id
    where cr.individual_id = p_individual_id
    and p.auth_id = auth.uid()
    and cr.relationship_role in ('owner', 'editor')
  ) AND not exists (
      select 1 
      from public.profiles target
      join public.organization_members my_mem on target.organization_id = my_mem.organization_id
      join public.profiles admin_profile on admin_profile.id = my_mem.profile_id
      where target.id = p_individual_id
      and admin_profile.auth_id = auth.uid()
      and my_mem.role = 'admin'
  ) then
      raise exception 'Permission denied: Cannot invite to this resident.';
  end if;
  
  -- Insert Invite
  insert into public.family_invites (individual_id, email, role, invited_by)
  values (p_individual_id, p_email, p_role, auth.uid())
  on conflict (individual_id, email) do nothing;
  
end;
$$;


-- 3. Update Trigger: Handle New User Unified
-- Adds logic to check family_invites and create care_relationships
create or replace function public.handle_new_user_unified()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  new_profile_id uuid;
  default_name text;
  meta_first_name text;
  meta_last_name text;
  invite_record record;
  family_invite_record record; -- NEW
begin
  -- A. Ensure Profile Exists
  select id into new_profile_id from public.profiles where auth_id = new.id;

  if new_profile_id is null then
      -- Log logic for profile creation
      default_name := new.raw_user_meta_data ->> 'full_name';
      meta_first_name := new.raw_user_meta_data ->> 'first_name';
      meta_last_name := new.raw_user_meta_data ->> 'last_name';
      
      if default_name is null or default_name = '' then
        default_name := split_part(new.email, '@', 1); 
      end if;
      if default_name is null or default_name = '' then
        default_name := 'Invited User';
      end if;

      insert into public.profiles (auth_id, full_name, first_name, last_name, role, avatar_url, email)
      values (
        new.id,
        default_name,
        meta_first_name,
        meta_last_name,
        'caregiver', 
        '',
        new.email
      ) returning id into new_profile_id;
  else
      -- Update email if profile already exists but email is null
      update public.profiles
      set email = new.email
      where id = new_profile_id and email is null;
  end if;

  -- B. Handle Invites (Only if Email is Confirmed)
  if new.email_confirmed_at is not null then
  
      -- 1. Organization Invites (Existing Logic)
      for invite_record in 
        select * from public.organization_invites 
        where email = new.email 
        and status = 'pending'
      loop
        if not exists (select 1 from public.organization_members where organization_id = invite_record.organization_id and profile_id = new_profile_id) then
            insert into public.organization_members (organization_id, profile_id, role)
            values (
              invite_record.organization_id,
              new_profile_id,
              invite_record.role
            );
        end if;

        update public.organization_invites
        set status = 'accepted'
        where id = invite_record.id;
      end loop;
      
      -- 2. Family Invites (NEW LOGIC)
      for family_invite_record in 
        select * from public.family_invites 
        where email = new.email 
        and status = 'pending'
      loop
        -- Create Care Relationship
        insert into public.care_relationships (caregiver_id, individual_id, relationship_role, status)
        values (
            new_profile_id,
            family_invite_record.individual_id,
            family_invite_record.role,
            'active'
        )
        on conflict (caregiver_id, individual_id) do nothing; -- Prevent duplicates
        
        -- Mark accepted
        update public.family_invites
        set status = 'accepted'
        where id = family_invite_record.id;
      end loop;
      
  end if;

  return new;
end;
$$;


-- 4. Update RPC: Create Individual
-- Added p_invite_emergency_contact param
create or replace function public.create_individual(
  p_first_name text,
  p_last_name text,
  p_date_of_birth date default null,
  p_phone text default null,
  p_address text default null,
  p_city text default null,
  p_state text default null,
  p_zip_code text default null,
  p_emergency_contact_name text default null,
  p_emergency_contact_phone text default null,
  p_emergency_contact_email text default null,
  p_emergency_contact_relationship text default null,
  p_medical_notes text default null,
  p_sex text default null,
  p_avatar_url text default null,
  p_organization_id uuid default null,
  p_invite_emergency_contact boolean default false -- NEW PARAM
)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  current_caregiver_id uuid;
  new_profile_id uuid;
  new_access_code text;
  full_name_computed text;
  result json;
begin
  -- Get current caregiver ID
  select id into current_caregiver_id from public.profiles where auth_id = auth.uid();
  if current_caregiver_id is null then
    raise exception 'Caregiver profile not found';
  end if;

  -- Generate random 6-digit access code
  new_access_code := floor(100000 + random() * 900000)::text;
  
  -- Compute full name
  full_name_computed := trim(p_first_name || ' ' || p_last_name);

  -- Insert Profile
  insert into public.profiles (
    full_name, 
    first_name, 
    last_name, 
    date_of_birth, 
    phone, 
    address, 
    city, 
    state, 
    zip_code,
    medical_notes,
    sex,
    role, 
    access_code,
    avatar_url,
    organization_id
  )
  values (
    full_name_computed,
    p_first_name,
    p_last_name,
    p_date_of_birth,
    p_phone,
    p_address,
    p_city,
    p_state,
    p_zip_code,
    p_medical_notes,
    p_sex,
    'individual',
    new_access_code,
    p_avatar_url,
    p_organization_id
  )
  returning id into new_profile_id;

  -- Insert Relationship
  insert into public.care_relationships (caregiver_id, individual_id, relationship_role, status)
  values (current_caregiver_id, new_profile_id, 'owner', 'active');

  -- Insert Emergency Contact (if provided)
  if p_emergency_contact_name is not null then
    insert into public.emergency_contacts (
      profile_id, 
      name, 
      phone, 
      email, 
      relationship, 
      is_primary
    )
    values (
      new_profile_id,
      p_emergency_contact_name,
      p_emergency_contact_phone,
      p_emergency_contact_email,
      p_emergency_contact_relationship,
      true
    );
    
    -- NEW: Invite Emergency Contact if requested and email exists
    if p_invite_emergency_contact = true AND p_emergency_contact_email is not null AND p_emergency_contact_email <> '' then
        insert into public.family_invites (individual_id, email, role, invited_by)
        values (new_profile_id, p_emergency_contact_email, 'editor', auth.uid())
        on conflict (individual_id, email) do nothing;
    end if;
    
  end if;

  -- Return the new profile data
  select row_to_json(p) into result from public.profiles p where id = new_profile_id;
  return result;
end;
$$;
-- Fix: Create Family Invite RPC
-- Logic updated to immediately grant access if the user already exists in the system.

create or replace function public.create_family_invite(
  p_individual_id uuid,
  p_email text,
  p_role text
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_existing_profile_id uuid;
begin
  -- 1. Validate permission: Must be Owner/Editor or Org Admin
  if not exists (
    select 1 from public.care_relationships cr
    join public.profiles p on p.id = cr.caregiver_id
    where cr.individual_id = p_individual_id
    and p.auth_id = auth.uid()
    and cr.relationship_role in ('owner', 'editor')
  ) AND not exists (
      select 1 
      from public.profiles target
      join public.organization_members my_mem on target.organization_id = my_mem.organization_id
      join public.profiles admin_profile on admin_profile.id = my_mem.profile_id
      where target.id = p_individual_id
      and admin_profile.auth_id = auth.uid()
      and my_mem.role = 'admin'
  ) then
      raise exception 'Permission denied: Cannot invite to this resident.';
  end if;
  
  -- 2. Check if user already exists
  select id into v_existing_profile_id from public.profiles where email = p_email limit 1;

  if v_existing_profile_id is not null then
      -- Case A: User exists. Grant access immediately.
      insert into public.care_relationships (caregiver_id, individual_id, relationship_role, status)
      values (v_existing_profile_id, p_individual_id, p_role, 'active')
      on conflict (caregiver_id, individual_id) do update
      set relationship_role = p_role, status = 'active'; -- Update role if exists
      
      -- Record the invite as 'accepted' for history
      insert into public.family_invites (individual_id, email, role, status, invited_by)
      values (p_individual_id, p_email, p_role, 'accepted', auth.uid())
      on conflict (individual_id, email) do update
      set status = 'accepted', role = p_role;  
      
  else
      -- Case B: User does not exist. Create pending invite.
      insert into public.family_invites (individual_id, email, role, status, invited_by)
      values (p_individual_id, p_email, p_role, 'pending', auth.uid())
      on conflict (individual_id, email) do nothing;
  end if;
  
end;
$$;

-- ==========================================
-- ORG ADMIN MANAGE POLICIES (Data Tables)
-- ==========================================
-- These policies give org admins full CRUD access to data belonging
-- to patients/residents within their organization.

-- Org Admins: Medications
create policy "Org Admins manage medications" on public.medications
  for all using (
    exists (
      select 1 from public.profiles target
      join public.organization_members my_mem on target.organization_id = my_mem.organization_id
      where target.id = medications.user_id
      and my_mem.profile_id = public.get_current_profile_id()
      and my_mem.status = 'active'
      and my_mem.role = 'admin'
    )
  );

-- Org Admins: Medication Logs
create policy "Org Admins manage medication logs" on public.medication_logs
  for all using (
    exists (
      select 1 from public.medications m
      join public.profiles target on target.id = m.user_id
      join public.organization_members my_mem on target.organization_id = my_mem.organization_id
      where m.id = medication_logs.medication_id
      and my_mem.profile_id = public.get_current_profile_id()
      and my_mem.status = 'active'
      and my_mem.role = 'admin'
    )
  );

-- Org Admins: Contacts
create policy "Org Admins manage contacts" on public.contacts
  for all using (
    exists (
      select 1 from public.profiles target
      join public.organization_members my_mem on target.organization_id = my_mem.organization_id
      where target.id = contacts.user_id
      and my_mem.profile_id = public.get_current_profile_id()
      and my_mem.status = 'active'
      and my_mem.role = 'admin'
    )
  );

-- Org Admins: Documents
create policy "Org Admins manage documents" on public.documents
  for all using (
    exists (
      select 1 from public.profiles target
      join public.organization_members my_mem on target.organization_id = my_mem.organization_id
      where target.id = documents.user_id
      and my_mem.profile_id = public.get_current_profile_id()
      and my_mem.status = 'active'
      and my_mem.role = 'admin'
    )
  );

-- Org Admins: Journal Entries
create policy "Org Admins manage journals" on public.journal_entries
  for all using (
    exists (
      select 1 from public.profiles target
      join public.organization_members my_mem on target.organization_id = my_mem.organization_id
      where target.id = journal_entries.user_id
      and my_mem.profile_id = public.get_current_profile_id()
      and my_mem.status = 'active'
      and my_mem.role = 'admin'
    )
  );

-- Org Admins: Daily Care Logs
create policy "Org Admins manage daily logs" on public.daily_care_logs
  for all using (
    exists (
      select 1 from public.profiles target
      join public.organization_members my_mem on target.organization_id = my_mem.organization_id
      where target.id = daily_care_logs.individual_id
      and my_mem.profile_id = public.get_current_profile_id()
      and my_mem.status = 'active'
      and my_mem.role = 'admin'
    )
  );

-- Org Admins: Dietary Logs
create policy "Org Admins manage dietary logs" on public.dietary_logs
  for all using (
    exists (
      select 1 from public.profiles target
      join public.organization_members my_mem on target.organization_id = my_mem.organization_id
      where target.id = dietary_logs.individual_id
      and my_mem.profile_id = public.get_current_profile_id()
      and my_mem.status = 'active'
      and my_mem.role = 'admin'
    )
  );

-- Org Admins: Emergency Contacts
create policy "Org Admins manage emergency contacts" on public.emergency_contacts
  for all using (
    exists (
      select 1 from public.profiles target
      join public.organization_members my_mem on target.organization_id = my_mem.organization_id
      where target.id = emergency_contacts.profile_id
      and my_mem.profile_id = public.get_current_profile_id()
      and my_mem.status = 'active'
      and my_mem.role = 'admin'
    )
  );

-- Org Admins: Clinicians
create policy "Org Admins manage clinicians" on public.clinicians
  for all using (
    exists (
      select 1 from public.profiles target
      join public.organization_members my_mem on target.organization_id = my_mem.organization_id
      where target.id = clinicians.individual_id
      and my_mem.profile_id = public.get_current_profile_id()
      and my_mem.status = 'active'
      and my_mem.role = 'admin'
    )
  );

-- Org Admins: Clinical Visits
create policy "Org Admins manage clinical visits" on public.clinical_visits
  for all using (
    exists (
      select 1 from public.profiles target
      join public.organization_members my_mem on target.organization_id = my_mem.organization_id
      where target.id = clinical_visits.individual_id
      and my_mem.profile_id = public.get_current_profile_id()
      and my_mem.status = 'active'
      and my_mem.role = 'admin'
    )
  );

-- Org Admins: Work Notes (for assigned patients only)
create policy "Org Admins manage work notes" on public.work_notes
  for all using (
    individual_id is not null
    and exists (
      select 1 from public.profiles target
      join public.organization_members my_mem on target.organization_id = my_mem.organization_id
      where target.id = work_notes.individual_id
      and my_mem.profile_id = public.get_current_profile_id()
      and my_mem.status = 'active'
      and my_mem.role = 'admin'
    )
  );

-- ==========================================
-- ORG ADMIN: Profiles — View Organization Residents
-- ==========================================
-- Fix: Allow Org Admins to view profiles of clients assigned to their staff
create policy "Org admins can view organization residents" on public.profiles
  for select using (
    exists (
      select 1
      from public.care_relationships cr
      join public.organization_members om_staff on om_staff.profile_id = cr.caregiver_id
      join public.organization_members om_admin on om_admin.organization_id = om_staff.organization_id
      where cr.individual_id = profiles.id
      and om_admin.profile_id = public.get_current_profile_id()
      and om_admin.role = 'admin'
      and om_admin.status = 'active'
    )
  );

-- ==========================================
-- FIX: care_relationships — DELETE/UPDATE for Org Admins
-- ==========================================
-- BUG FIX: Org admins could not remove patient assignments because
-- care_relationships only had SELECT and INSERT policies for admins.

create policy "Org admins can delete staff assignments" on public.care_relationships
  for delete using (
    exists (
      select 1 from public.organization_members om_caregiver
      join public.organization_members om_admin on om_admin.organization_id = om_caregiver.organization_id
      where om_caregiver.profile_id = care_relationships.caregiver_id
      and om_admin.profile_id = public.get_current_profile_id()
      and om_admin.role = 'admin'
      and om_admin.status = 'active'
    )
  );

create policy "Org admins can update staff assignments" on public.care_relationships
  for update using (
    exists (
      select 1 from public.organization_members om_caregiver
      join public.organization_members om_admin on om_admin.organization_id = om_caregiver.organization_id
      where om_caregiver.profile_id = care_relationships.caregiver_id
      and om_admin.profile_id = public.get_current_profile_id()
      and om_admin.role = 'admin'
      and om_admin.status = 'active'
    )
  );

-- ==========================================
-- FIX: medications — DELETE/UPDATE for Caregivers
-- ==========================================
-- Caregivers with owner/editor role can now update and delete medications.

create policy "Caregivers update managed medications" on public.medications
  for update using (
    exists (
      select 1 
      from public.care_relationships cr
      join public.profiles p on p.id = cr.caregiver_id
      where p.auth_id = auth.uid()
      and cr.individual_id = medications.user_id
      and cr.relationship_role in ('owner', 'editor')
    )
  );

create policy "Caregivers delete managed medications" on public.medications
  for delete using (
    exists (
      select 1 
      from public.care_relationships cr
      join public.profiles p on p.id = cr.caregiver_id
      where p.auth_id = auth.uid()
      and cr.individual_id = medications.user_id
      and cr.relationship_role in ('owner', 'editor')
    )
  );

-- ==========================================
-- FIX: medication_logs — DELETE for Caregivers
-- ==========================================

create policy "Caregivers delete managed med logs" on public.medication_logs
  for delete using (
    exists (
      select 1 
      from public.medications m
      join public.care_relationships cr on cr.individual_id = m.user_id
      join public.profiles p on p.id = cr.caregiver_id
      where m.id = medication_logs.medication_id
      and p.auth_id = auth.uid()
      and cr.relationship_role in ('owner', 'editor')
    )
  );

-- ==========================================
-- FIX: medication_logs FK — CASCADE on delete
-- ==========================================
-- Deleting a medication now cascades to remove its logs automatically.

alter table public.medication_logs
  drop constraint if exists medication_logs_medication_id_fkey;

alter table public.medication_logs
  add constraint medication_logs_medication_id_fkey
  foreign key (medication_id)
  references public.medications(id)
  on delete cascade;

-- ====================================================================
-- MIGRATION: RLS Logical Loopholes and Shift/Medication Integrity Fixes
-- ====================================================================

-- 1. Enforce Active Status on Organization Helper Functions
create or replace function public.current_user_is_member_of(org_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  return exists (
    select 1 from public.organization_members
    where organization_id = org_id
    and profile_id = public.get_current_profile_id()
    and status = 'active'
  );
end;
$$;

create or replace function public.current_user_is_org_admin(org_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  return exists (
    select 1 from public.organization_members
    where organization_id = org_id
    and profile_id = public.get_current_profile_id()
    and role = 'admin'
    and status = 'active'
  );
end;
$$;


-- 2. Fix profiles policy: restrict organization residents SELECT to active members
drop policy if exists "Org members can view org patients" on public.profiles;
create policy "Org members can view org patients" on public.profiles
  for select using (
    organization_id is not null 
    and public.current_user_is_member_of(organization_id)
  );


-- 3. Shift Integrity Policies
drop policy if exists "Caregivers determine own shifts" on public.shifts;
drop policy if exists "Admins view org shifts" on public.shifts;

-- Caregiver: Select own shifts
create policy "Caregivers view own shifts" on public.shifts
  for select using (
    caregiver_id = public.get_current_profile_id()
  );

-- Caregiver: Insert own shifts
create policy "Caregivers insert own shifts" on public.shifts
  for insert with check (
    caregiver_id = public.get_current_profile_id()
  );

-- Caregiver: Update own active shifts only
create policy "Caregivers update active shifts" on public.shifts
  for update using (
    caregiver_id = public.get_current_profile_id()
    and (status = 'active' or end_time is null)
  );

-- Org Admins: Manage shifts (ALL permissions)
create policy "Admins manage org shifts" on public.shifts
  for all using (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = shifts.organization_id
      and om.profile_id = public.get_current_profile_id()
      and om.role = 'admin'
      and om.status = 'active'
    )
  );


-- 4. Medication Archiving (discontinued status)
alter table public.medications add column if not exists status text check (status in ('active', 'discontinued')) default 'active';


-- 5. Legal Directives Audit Logging
create table if not exists public.profile_audit_logs (
  id uuid not null default gen_random_uuid() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  changed_by uuid references public.profiles(id) on delete set null,
  field_name text not null,
  old_value text,
  new_value text,
  changed_at timestamptz not null default now()
);

-- Enable RLS
alter table public.profile_audit_logs enable row level security;

-- Admin visibility policy for audit logs
create policy "Admins view audit logs" on public.profile_audit_logs
  for select using (
    exists (
      select 1 from public.profiles p
      join public.organization_members om on p.organization_id = om.organization_id
      where p.id = profile_audit_logs.profile_id
      and om.profile_id = public.get_current_profile_id()
      and om.role = 'admin'
      and om.status = 'active'
    )
  );

-- Caregiver visibility policy for audit logs (if they manage the patient)
create policy "Managed caregivers view audit logs" on public.profile_audit_logs
  for select using (
    exists (
      select 1 from public.care_relationships cr
      where cr.individual_id = profile_audit_logs.profile_id
      and cr.caregiver_id = public.get_current_profile_id()
    )
  );

-- Trigger function to log legal directives updates
create or replace function public.audit_profile_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_profile_id uuid;
begin
  current_user_profile_id := public.get_current_profile_id();
  
  -- DNR Status
  if (old.dnr_status is distinct from new.dnr_status) then
    insert into public.profile_audit_logs (profile_id, changed_by, field_name, old_value, new_value)
    values (new.id, current_user_profile_id, 'dnr_status', old.dnr_status::text, new.dnr_status::text);
  end if;
  
  -- DNR Doc URL
  if (old.dnr_document_url is distinct from new.dnr_document_url) then
    insert into public.profile_audit_logs (profile_id, changed_by, field_name, old_value, new_value)
    values (new.id, current_user_profile_id, 'dnr_document_url', old.dnr_document_url, new.dnr_document_url);
  end if;

  -- Living Will Status
  if (old.living_will_status is distinct from new.living_will_status) then
    insert into public.profile_audit_logs (profile_id, changed_by, field_name, old_value, new_value)
    values (new.id, current_user_profile_id, 'living_will_status', old.living_will_status::text, new.living_will_status::text);
  end if;

  -- Living Will Doc URL
  if (old.living_will_document_url is distinct from new.living_will_document_url) then
    insert into public.profile_audit_logs (profile_id, changed_by, field_name, old_value, new_value)
    values (new.id, current_user_profile_id, 'living_will_document_url', old.living_will_document_url, new.living_will_document_url);
  end if;

  -- POA Name
  if (old.poa_name is distinct from new.poa_name) then
    insert into public.profile_audit_logs (profile_id, changed_by, field_name, old_value, new_value)
    values (new.id, current_user_profile_id, 'poa_name', old.poa_name, new.poa_name);
  end if;

  -- POA Phone
  if (old.poa_phone is distinct from new.poa_phone) then
    insert into public.profile_audit_logs (profile_id, changed_by, field_name, old_value, new_value)
    values (new.id, current_user_profile_id, 'poa_phone', old.poa_phone, new.poa_phone);
  end if;

  -- POA Email
  if (old.poa_email is distinct from new.poa_email) then
    insert into public.profile_audit_logs (profile_id, changed_by, field_name, old_value, new_value)
    values (new.id, current_user_profile_id, 'poa_email', old.poa_email, new.poa_email);
  end if;

  return new;
end;
$$;

-- Create trigger on profiles
drop trigger if exists audit_profile_changes_trigger on public.profiles;
create trigger audit_profile_changes_trigger
  after update on public.profiles
  for each row
  execute function public.audit_profile_changes();

-- Delayed Policies
-- Organization admins can create relationships for their staff members
create policy "Org admins can assign staff to clients" on public.care_relationships
  for insert with check (
    exists (
      select 1 from public.organization_members
      where organization_members.profile_id = public.get_current_profile_id()
      and organization_members.role = 'admin'
    )
  );

-- Organization admins can view care_relationships for their staff members
create policy "Org admins can view staff assignments" on public.care_relationships
  for select using (
    exists (
      select 1 from public.organization_members om_caregiver
      join public.organization_members om_admin on om_admin.organization_id = om_caregiver.organization_id
      where om_caregiver.profile_id = care_relationships.caregiver_id
      and om_admin.profile_id = public.get_current_profile_id()
      and om_admin.role = 'admin'
      and om_admin.status = 'active'
    )
  );

-- Policy 3: General Work Notes (Unassigned) - Visible to org colleagues
create policy "Org members view general work notes" on public.work_notes
  for select using (
    individual_id is null
    and exists (
      select 1 
      from public.organization_members viewer_mem
      join public.organization_members creator_mem on viewer_mem.organization_id = creator_mem.organization_id
      where viewer_mem.profile_id = public.get_current_profile_id()
      and creator_mem.profile_id = work_notes.created_by
      and viewer_mem.status = 'active'
    )
  );

-- Policy 2: Organization Members can view work notes for org patients (Agency/Facility model)
create policy "Org members view work notes for org patients" on public.work_notes
  for select using (
    individual_id is not null
    and exists (
      select 1 from public.profiles patient
      join public.organization_members me on me.organization_id = patient.organization_id
      where patient.id = work_notes.individual_id
      and me.profile_id = public.get_current_profile_id()
    )
  );

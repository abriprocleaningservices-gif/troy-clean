-- =============================================================================
-- Troy Premier Green Cleaning Co. — Initial schema
-- Run against a Supabase/Postgres project via `supabase db push` or the SQL editor.
-- =============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------
create type user_role as enum ('owner', 'admin', 'cleaner', 'property_manager', 'customer');

create type booking_status as enum (
  'requested',
  'pending_payment',
  'confirmed',
  'assigned',
  'cleaner_en_route',
  'in_progress',
  'completed',
  'cancelled',
  'no_show'
);

create type payment_status as enum ('pending', 'paid', 'partially_paid', 'refunded', 'failed');
create type payment_method as enum ('card', 'cash', 'check', 'ach', 'other');
create type payment_timing as enum ('full', 'deposit', 'pay_later');
create type service_category as enum ('residential', 'commercial', 'apartment');
create type frequency_type as enum ('one_time', 'weekly', 'biweekly', 'monthly');
create type job_action as enum ('start', 'pause', 'resume', 'complete', 'issue');
create type lead_status as enum ('new', 'contacted', 'quoted', 'won', 'lost');

-- ---------------------------------------------------------------------------
-- USERS  (mirrors auth.users, one row per authenticated person; role-driven)
-- ---------------------------------------------------------------------------
create table users (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null default 'customer',
  first_name text not null,
  last_name text not null,
  email text not null unique,
  phone text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- CUSTOMERS
-- ---------------------------------------------------------------------------
create table customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users (id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  is_recurring boolean not null default false,
  notes text,
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_customers_email on customers (email);

-- ---------------------------------------------------------------------------
-- PROPERTIES  (a customer's serviced address; also used for PM units)
-- ---------------------------------------------------------------------------
create table properties (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers (id) on delete cascade,
  property_manager_id uuid, -- fk added after property_managers table exists
  label text,
  address_line1 text not null,
  address_line2 text,
  city text not null default 'Troy',
  state text not null default 'MI',
  zip text not null,
  unit_number text,
  bedrooms int,
  bathrooms numeric(3,1),
  square_footage int,
  access_instructions text,
  parking_instructions text,
  pets boolean not null default false,
  pet_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_properties_customer on properties (customer_id);

-- ---------------------------------------------------------------------------
-- CLEANERS
-- ---------------------------------------------------------------------------
create table cleaners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users (id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  hire_date date,
  is_active boolean not null default true,
  color_hex text default '#3f7d5a', -- calendar color
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- SERVICES  (top-level service catalog, admin editable)
-- ---------------------------------------------------------------------------
create table services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category service_category not null,
  description text,
  base_duration_minutes int not null default 120,
  is_active boolean not null default true,
  sort_order int not null default 0,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- SERVICE ADD-ONS  (admin editable, price driven by pricing_rules)
-- ---------------------------------------------------------------------------
create table service_addons (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  extra_minutes int not null default 15,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- PRICING RULES  (fully admin-editable pricing engine — nothing hard-coded)
-- rule_type distinguishes how `value` is applied by the pricing engine:
--   base_rate        -> flat starting price for a service
--   per_bedroom       -> value added per bedroom beyond the first
--   per_bathroom      -> value added per bathroom beyond the first
--   per_sqft_block    -> value added per `unit_size` sq ft block
--   frequency_discount-> percentage discount applied for recurring frequency
--   condition_multiplier -> multiplier applied for "current condition" answer
--   addon_flat        -> flat price for a specific service_addon
--   minimum_price     -> price floor for a service
-- ---------------------------------------------------------------------------
create table pricing_rules (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references services (id) on delete cascade,
  addon_id uuid references service_addons (id) on delete cascade,
  rule_type text not null,
  label text not null,
  value numeric(10,2) not null,           -- dollar amount or percentage (0-100) depending on rule_type
  unit_size int,                          -- e.g. sq ft per block for per_sqft_block
  condition_key text,                     -- e.g. 'light' | 'moderate' | 'heavy' for condition_multiplier
  frequency frequency_type,               -- for frequency_discount rows
  is_active boolean not null default true,
  effective_from timestamptz not null default now(),
  effective_to timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_rule_target check (
    (rule_type = 'addon_flat' and addon_id is not null) or
    (rule_type <> 'addon_flat' and service_id is not null)
  )
);
create index idx_pricing_rules_service on pricing_rules (service_id);

-- ---------------------------------------------------------------------------
-- AVAILABILITY  (cleaner working windows; bookings are checked against this)
-- ---------------------------------------------------------------------------
create table availability (
  id uuid primary key default gen_random_uuid(),
  cleaner_id uuid not null references cleaners (id) on delete cascade,
  day_of_week int check (day_of_week between 0 and 6), -- null when date_override is set
  start_time time,
  end_time time,
  date_override date,          -- for one-off overrides (time off, added hours)
  is_available boolean not null default true, -- false = explicit blackout
  created_at timestamptz not null default now()
);
create index idx_availability_cleaner on availability (cleaner_id);

-- ---------------------------------------------------------------------------
-- BOOKINGS
-- ---------------------------------------------------------------------------
create table bookings (
  id uuid primary key default gen_random_uuid(),
  booking_number text not null unique default ('TP-' || to_char(now(), 'YYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 6)),
  customer_id uuid not null references customers (id) on delete restrict,
  property_id uuid not null references properties (id) on delete restrict,
  service_id uuid not null references services (id) on delete restrict,
  status booking_status not null default 'requested',
  frequency frequency_type not null default 'one_time',
  scheduled_date date not null,
  scheduled_start_time time not null,
  estimated_duration_minutes int not null,
  current_condition text,          -- 'light' | 'moderate' | 'heavy'
  special_requests text,
  subtotal numeric(10,2) not null default 0,
  discount_total numeric(10,2) not null default 0,
  tax_total numeric(10,2) not null default 0,
  total_price numeric(10,2) not null default 0,
  payment_timing payment_timing not null default 'full',
  payment_status payment_status not null default 'pending',
  source text not null default 'website',
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_bookings_customer on bookings (customer_id);
create index idx_bookings_date on bookings (scheduled_date);
create index idx_bookings_status on bookings (status);

-- Prevent literal double-booking of the same property/date/time combination
create unique index uq_bookings_property_slot
  on bookings (property_id, scheduled_date, scheduled_start_time)
  where status not in ('cancelled', 'no_show');

-- ---------------------------------------------------------------------------
-- BOOKING ITEMS  (line items: base service + each selected add-on, for invoicing)
-- ---------------------------------------------------------------------------
create table booking_items (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings (id) on delete cascade,
  addon_id uuid references service_addons (id) on delete set null,
  description text not null,
  quantity int not null default 1,
  unit_price numeric(10,2) not null,
  line_total numeric(10,2) not null,
  created_at timestamptz not null default now()
);
create index idx_booking_items_booking on booking_items (booking_id);

-- ---------------------------------------------------------------------------
-- JOBS  (operational record tied 1:1 to a booking, tracked by cleaners)
-- ---------------------------------------------------------------------------
create table jobs (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references bookings (id) on delete cascade,
  status booking_status not null default 'assigned',
  started_at timestamptz,
  paused_at timestamptz,
  completed_at timestamptz,
  total_paused_minutes int not null default 0,
  issue_reported boolean not null default false,
  issue_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- JOB ASSIGNMENTS  (supports multiple cleaners per job)
-- ---------------------------------------------------------------------------
create table job_assignments (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs (id) on delete cascade,
  cleaner_id uuid not null references cleaners (id) on delete cascade,
  is_lead boolean not null default true,
  assigned_at timestamptz not null default now(),
  unique (job_id, cleaner_id)
);

-- ---------------------------------------------------------------------------
-- JOB ACTION LOG  (audit trail: start/pause/complete/issue events)
-- ---------------------------------------------------------------------------
create table job_action_log (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs (id) on delete cascade,
  cleaner_id uuid references cleaners (id) on delete set null,
  action job_action not null,
  notes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- CHECKLISTS  (per-service checklist templates + per-job completion state)
-- ---------------------------------------------------------------------------
create table checklist_templates (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services (id) on delete cascade,
  item_text text not null,
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table checklists (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs (id) on delete cascade,
  checklist_template_id uuid references checklist_templates (id) on delete set null,
  item_text text not null,
  is_completed boolean not null default false,
  completed_at timestamptz,
  completed_by uuid references cleaners (id)
);
create index idx_checklists_job on checklists (job_id);

-- ---------------------------------------------------------------------------
-- BEFORE / AFTER PHOTOS
-- ---------------------------------------------------------------------------
create table before_after_photos (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs (id) on delete cascade,
  photo_type text not null check (photo_type in ('before', 'after')),
  storage_path text not null, -- Supabase Storage object path
  uploaded_by uuid references cleaners (id),
  caption text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- PAYMENTS
-- ---------------------------------------------------------------------------
create table payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings (id) on delete cascade,
  stripe_payment_intent_id text,
  amount numeric(10,2) not null,
  method payment_method not null default 'card',
  status payment_status not null default 'pending',
  paid_at timestamptz,
  refunded_amount numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);
create index idx_payments_booking on payments (booking_id);

-- ---------------------------------------------------------------------------
-- INVOICES
-- ---------------------------------------------------------------------------
create table invoices (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings (id) on delete cascade,
  invoice_number text not null unique default ('INV-' || to_char(now(), 'YYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 6)),
  amount_due numeric(10,2) not null,
  amount_paid numeric(10,2) not null default 0,
  status payment_status not null default 'pending',
  due_date date,
  pdf_storage_path text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- MESSAGES  (office <-> customer/cleaner communication log; also SMS/email log)
-- ---------------------------------------------------------------------------
create table messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings (id) on delete cascade,
  customer_id uuid references customers (id) on delete cascade,
  cleaner_id uuid references cleaners (id) on delete cascade,
  channel text not null check (channel in ('sms', 'email', 'internal')),
  direction text not null check (direction in ('outbound', 'inbound')),
  template_key text,
  subject text,
  body text not null,
  status text not null default 'sent',
  provider_message_id text,
  created_at timestamptz not null default now()
);
create index idx_messages_booking on messages (booking_id);

-- ---------------------------------------------------------------------------
-- REVIEWS
-- ---------------------------------------------------------------------------
create table reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings (id) on delete set null,
  customer_id uuid references customers (id) on delete set null,
  rating int not null check (rating between 1 and 5),
  comment text,
  is_published boolean not null default false,
  response_text text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- PROPERTY MANAGERS  (separate workflow for apartment/PM accounts)
-- ---------------------------------------------------------------------------
create table property_managers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users (id) on delete set null,
  company_name text not null,
  contact_first_name text not null,
  contact_last_name text not null,
  email text not null,
  phone text not null,
  portfolio_notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table properties
  add constraint fk_properties_property_manager
  foreign key (property_manager_id) references property_managers (id) on delete set null;

-- ---------------------------------------------------------------------------
-- PROPERTY MANAGER REQUESTS  (turnover / move-out / move-in / recurring janitorial)
-- ---------------------------------------------------------------------------
create table property_manager_requests (
  id uuid primary key default gen_random_uuid(),
  property_manager_id uuid not null references property_managers (id) on delete cascade,
  request_type text not null check (request_type in (
    'apartment_turnover', 'move_out', 'move_in', 'common_area', 'leasing_office', 'recurring_janitorial'
  )),
  property_name text not null,
  unit_number text,
  square_footage int,
  bedrooms int,
  bathrooms numeric(3,1),
  move_out_date date,
  desired_completion_date date,
  special_instructions text,
  status lead_status not null default 'new',
  linked_booking_id uuid references bookings (id) on delete set null,
  created_at timestamptz not null default now()
);

create table property_manager_request_photos (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references property_manager_requests (id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- COMMERCIAL ACCOUNTS + LEADS
-- ---------------------------------------------------------------------------
create table commercial_accounts (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  primary_contact_name text not null,
  email text not null,
  phone text not null,
  billing_address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table commercial_leads (
  id uuid primary key default gen_random_uuid(),
  commercial_account_id uuid references commercial_accounts (id) on delete set null,
  company_name text not null,
  contact_name text not null,
  phone text not null,
  email text not null,
  property_address text not null,
  property_type text,
  square_footage int,
  frequency frequency_type,
  restroom_count int,
  cleaning_requirements text,
  preferred_walkthrough_date date,
  status lead_status not null default 'new',
  admin_notes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- SMS / EMAIL TEMPLATES  (admin editable, referenced by template_key)
-- ---------------------------------------------------------------------------
create table message_templates (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('sms', 'email')),
  template_key text not null,
  name text not null,
  subject text,          -- email only
  body text not null,    -- supports {{first_name}}, {{booking_date}}, etc. placeholders
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (channel, template_key)
);

-- ---------------------------------------------------------------------------
-- SITE SETTINGS  (single-row config table for admin-toggleable global options)
-- ---------------------------------------------------------------------------
create table site_settings (
  id boolean primary key default true constraint single_row check (id),
  guarantee_messaging_enabled boolean not null default false,
  guarantee_messaging_text text,
  deposit_percentage numeric(5,2) not null default 25.00,
  tax_rate_percentage numeric(5,2) not null default 6.00,
  booking_lead_time_hours int not null default 24,
  updated_at timestamptz not null default now()
);
insert into site_settings (id) values (true);

-- ---------------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------------
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare t text;
begin
  for t in select unnest(array[
    'users','customers','properties','cleaners','services','pricing_rules',
    'bookings','jobs','site_settings'
  ]) loop
    execute format('create trigger trg_set_updated_at before update on %I for each row execute function set_updated_at();', t);
  end loop;
end $$;

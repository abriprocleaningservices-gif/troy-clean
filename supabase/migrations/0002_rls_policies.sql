-- =============================================================================
-- Row Level Security
-- Strategy: every table has RLS enabled. Staff (owner/admin) get full access.
-- Cleaners see only their own assignments. Customers see only their own data.
-- Public/anon can INSERT leads and quote requests but not read others' data.
-- All server-privileged writes (payments, status transitions driven by Stripe/
-- Twilio webhooks) go through Netlify Functions using the service_role key,
-- which bypasses RLS by design — so those functions are the enforcement point
-- for anything not covered cleanly by a policy below.
-- =============================================================================

alter table users enable row level security;
alter table customers enable row level security;
alter table properties enable row level security;
alter table cleaners enable row level security;
alter table services enable row level security;
alter table service_addons enable row level security;
alter table pricing_rules enable row level security;
alter table availability enable row level security;
alter table bookings enable row level security;
alter table booking_items enable row level security;
alter table jobs enable row level security;
alter table job_assignments enable row level security;
alter table job_action_log enable row level security;
alter table checklist_templates enable row level security;
alter table checklists enable row level security;
alter table before_after_photos enable row level security;
alter table payments enable row level security;
alter table invoices enable row level security;
alter table messages enable row level security;
alter table reviews enable row level security;
alter table property_managers enable row level security;
alter table property_manager_requests enable row level security;
alter table property_manager_request_photos enable row level security;
alter table commercial_accounts enable row level security;
alter table commercial_leads enable row level security;
alter table message_templates enable row level security;
alter table site_settings enable row level security;

-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER so they can read `users` regardless of
-- the caller's own row visibility, avoiding recursive RLS lookups)
-- ---------------------------------------------------------------------------
create or replace function current_user_role() returns user_role as $$
  select role from users where id = auth.uid();
$$ language sql stable security definer;

create or replace function is_staff() returns boolean as $$
  select current_user_role() in ('owner', 'admin');
$$ language sql stable security definer;

create or replace function current_cleaner_id() returns uuid as $$
  select id from cleaners where user_id = auth.uid();
$$ language sql stable security definer;

create or replace function current_customer_id() returns uuid as $$
  select id from customers where user_id = auth.uid();
$$ language sql stable security definer;

create or replace function current_property_manager_id() returns uuid as $$
  select id from property_managers where user_id = auth.uid();
$$ language sql stable security definer;

-- ---------------------------------------------------------------------------
-- USERS
-- ---------------------------------------------------------------------------
create policy "users_select_self_or_staff" on users for select
  using (id = auth.uid() or is_staff());
create policy "users_update_self_or_staff" on users for update
  using (id = auth.uid() or is_staff());
create policy "users_insert_staff" on users for insert
  with check (is_staff() or id = auth.uid());

-- ---------------------------------------------------------------------------
-- CUSTOMERS
-- ---------------------------------------------------------------------------
create policy "customers_select" on customers for select
  using (is_staff() or user_id = auth.uid());
create policy "customers_update" on customers for update
  using (is_staff() or user_id = auth.uid());
create policy "customers_insert_public" on customers for insert
  with check (true); -- public booking flow creates a customer row pre-auth

-- ---------------------------------------------------------------------------
-- PROPERTIES
-- ---------------------------------------------------------------------------
create policy "properties_select" on properties for select
  using (
    is_staff()
    or customer_id = current_customer_id()
    or property_manager_id = current_property_manager_id()
  );
create policy "properties_write" on properties for all
  using (
    is_staff()
    or customer_id = current_customer_id()
    or property_manager_id = current_property_manager_id()
  )
  with check (true);

-- ---------------------------------------------------------------------------
-- CLEANERS  (staff manage; a cleaner can view/update their own profile)
-- ---------------------------------------------------------------------------
create policy "cleaners_select" on cleaners for select
  using (is_staff() or user_id = auth.uid());
create policy "cleaners_staff_write" on cleaners for all
  using (is_staff()) with check (is_staff());
create policy "cleaners_self_update" on cleaners for update
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- SERVICES / ADD-ONS / PRICING — publicly readable (needed for the booking
-- wizard before login), staff-only writable.
-- ---------------------------------------------------------------------------
create policy "services_public_read" on services for select using (is_active or is_staff());
create policy "services_staff_write" on services for insert with check (is_staff());
create policy "services_staff_update" on services for update using (is_staff());
create policy "services_staff_delete" on services for delete using (is_staff());

create policy "addons_public_read" on service_addons for select using (is_active or is_staff());
create policy "addons_staff_write" on service_addons for insert with check (is_staff());
create policy "addons_staff_update" on service_addons for update using (is_staff());
create policy "addons_staff_delete" on service_addons for delete using (is_staff());

create policy "pricing_public_read" on pricing_rules for select using (is_active or is_staff());
create policy "pricing_staff_write" on pricing_rules for insert with check (is_staff());
create policy "pricing_staff_update" on pricing_rules for update using (is_staff());
create policy "pricing_staff_delete" on pricing_rules for delete using (is_staff());

-- ---------------------------------------------------------------------------
-- AVAILABILITY — publicly readable (booking calendar needs it), staff/cleaner write
-- ---------------------------------------------------------------------------
create policy "availability_public_read" on availability for select using (true);
create policy "availability_staff_write" on availability for insert with check (is_staff());
create policy "availability_staff_update" on availability for update using (is_staff());
create policy "availability_cleaner_own_update" on availability for update
  using (cleaner_id = current_cleaner_id());
create policy "availability_staff_delete" on availability for delete using (is_staff());

-- ---------------------------------------------------------------------------
-- BOOKINGS
-- ---------------------------------------------------------------------------
create policy "bookings_select" on bookings for select
  using (
    is_staff()
    or customer_id = current_customer_id()
    or exists (
      select 1 from jobs j join job_assignments ja on ja.job_id = j.id
      where j.booking_id = bookings.id and ja.cleaner_id = current_cleaner_id()
    )
  );
create policy "bookings_insert_public" on bookings for insert with check (true);
create policy "bookings_update" on bookings for update
  using (is_staff() or customer_id = current_customer_id());

-- ---------------------------------------------------------------------------
-- BOOKING ITEMS
-- ---------------------------------------------------------------------------
create policy "booking_items_select" on booking_items for select
  using (
    is_staff() or exists (
      select 1 from bookings b where b.id = booking_items.booking_id
      and b.customer_id = current_customer_id()
    )
  );
create policy "booking_items_insert" on booking_items for insert with check (true);

-- ---------------------------------------------------------------------------
-- JOBS / ASSIGNMENTS / ACTION LOG — staff full; assigned cleaner limited
-- ---------------------------------------------------------------------------
create policy "jobs_select" on jobs for select
  using (
    is_staff() or exists (
      select 1 from job_assignments ja where ja.job_id = jobs.id and ja.cleaner_id = current_cleaner_id()
    )
  );
create policy "jobs_staff_write" on jobs for insert with check (is_staff());
create policy "jobs_update" on jobs for update
  using (
    is_staff() or exists (
      select 1 from job_assignments ja where ja.job_id = jobs.id and ja.cleaner_id = current_cleaner_id()
    )
  );

create policy "job_assignments_select" on job_assignments for select
  using (is_staff() or cleaner_id = current_cleaner_id());
create policy "job_assignments_staff_write" on job_assignments for all
  using (is_staff()) with check (is_staff());

create policy "job_action_log_select" on job_action_log for select
  using (is_staff() or cleaner_id = current_cleaner_id());
create policy "job_action_log_insert" on job_action_log for insert
  with check (is_staff() or cleaner_id = current_cleaner_id());

-- ---------------------------------------------------------------------------
-- CHECKLISTS
-- ---------------------------------------------------------------------------
create policy "checklist_templates_read" on checklist_templates for select using (true);
create policy "checklist_templates_staff_write" on checklist_templates for all
  using (is_staff()) with check (is_staff());

create policy "checklists_select" on checklists for select
  using (
    is_staff() or exists (
      select 1 from job_assignments ja where ja.job_id = checklists.job_id and ja.cleaner_id = current_cleaner_id()
    )
  );
create policy "checklists_update" on checklists for update
  using (
    is_staff() or exists (
      select 1 from job_assignments ja where ja.job_id = checklists.job_id and ja.cleaner_id = current_cleaner_id()
    )
  );
create policy "checklists_staff_insert" on checklists for insert with check (is_staff());

-- ---------------------------------------------------------------------------
-- BEFORE/AFTER PHOTOS
-- ---------------------------------------------------------------------------
create policy "photos_select" on before_after_photos for select
  using (
    is_staff()
    or exists (
      select 1 from jobs j join bookings b on b.id = j.booking_id
      where j.id = before_after_photos.job_id and b.customer_id = current_customer_id()
    )
    or exists (
      select 1 from job_assignments ja where ja.job_id = before_after_photos.job_id and ja.cleaner_id = current_cleaner_id()
    )
  );
create policy "photos_insert" on before_after_photos for insert
  with check (
    is_staff() or exists (
      select 1 from job_assignments ja where ja.job_id = before_after_photos.job_id and ja.cleaner_id = current_cleaner_id()
    )
  );

-- ---------------------------------------------------------------------------
-- PAYMENTS / INVOICES — staff + owning customer, read-only for customer
-- ---------------------------------------------------------------------------
create policy "payments_select" on payments for select
  using (
    is_staff() or exists (
      select 1 from bookings b where b.id = payments.booking_id and b.customer_id = current_customer_id()
    )
  );
create policy "payments_staff_write" on payments for all using (is_staff()) with check (is_staff());

create policy "invoices_select" on invoices for select
  using (
    is_staff() or exists (
      select 1 from bookings b where b.id = invoices.booking_id and b.customer_id = current_customer_id()
    )
  );
create policy "invoices_staff_write" on invoices for all using (is_staff()) with check (is_staff());

-- ---------------------------------------------------------------------------
-- MESSAGES
-- ---------------------------------------------------------------------------
create policy "messages_select" on messages for select
  using (is_staff() or customer_id = current_customer_id() or cleaner_id = current_cleaner_id());
create policy "messages_staff_write" on messages for all using (is_staff()) with check (is_staff());

-- ---------------------------------------------------------------------------
-- REVIEWS — published reviews are public; staff manage all
-- ---------------------------------------------------------------------------
create policy "reviews_public_read" on reviews for select using (is_published or is_staff());
create policy "reviews_customer_insert" on reviews for insert
  with check (customer_id = current_customer_id() or is_staff());
create policy "reviews_staff_update" on reviews for update using (is_staff());

-- ---------------------------------------------------------------------------
-- PROPERTY MANAGERS + REQUESTS
-- ---------------------------------------------------------------------------
create policy "pm_select" on property_managers for select
  using (is_staff() or user_id = auth.uid());
create policy "pm_insert_public" on property_managers for insert with check (true);
create policy "pm_update" on property_managers for update
  using (is_staff() or user_id = auth.uid());

create policy "pm_requests_select" on property_manager_requests for select
  using (is_staff() or property_manager_id = current_property_manager_id());
create policy "pm_requests_insert" on property_manager_requests for insert with check (true);
create policy "pm_requests_update" on property_manager_requests for update
  using (is_staff() or property_manager_id = current_property_manager_id());

create policy "pm_request_photos_select" on property_manager_request_photos for select
  using (
    is_staff() or exists (
      select 1 from property_manager_requests r
      where r.id = property_manager_request_photos.request_id
      and r.property_manager_id = current_property_manager_id()
    )
  );
create policy "pm_request_photos_insert" on property_manager_request_photos for insert with check (true);

-- ---------------------------------------------------------------------------
-- COMMERCIAL ACCOUNTS + LEADS — staff manage; public can submit a lead
-- ---------------------------------------------------------------------------
create policy "commercial_accounts_staff" on commercial_accounts for all
  using (is_staff()) with check (is_staff());

create policy "commercial_leads_staff_read" on commercial_leads for select using (is_staff());
create policy "commercial_leads_public_insert" on commercial_leads for insert with check (true);
create policy "commercial_leads_staff_update" on commercial_leads for update using (is_staff());

-- ---------------------------------------------------------------------------
-- MESSAGE TEMPLATES + SITE SETTINGS — staff only
-- ---------------------------------------------------------------------------
create policy "templates_staff" on message_templates for all using (is_staff()) with check (is_staff());
create policy "settings_read" on site_settings for select using (true);
create policy "settings_staff_write" on site_settings for update using (is_staff());

-- =============================================================================
-- Seed data — safe to run once against a fresh database.
-- Prices below are STARTER defaults only. Edit them in Admin > Pricing —
-- nothing in the application code hard-codes a dollar amount.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- SERVICES
-- ---------------------------------------------------------------------------
insert into services (slug, name, category, description, base_duration_minutes, sort_order, seo_title, seo_description) values
('standard-cleaning', 'Standard Residential Cleaning', 'residential', 'Recurring or one-time cleaning covering kitchens, bathrooms, living areas, and bedrooms.', 120, 1,
  'House Cleaning Troy MI | Standard Residential Cleaning', 'Reliable, eco-friendly standard house cleaning in Troy, MI. Book online in minutes with upfront pricing.'),
('deep-cleaning', 'Deep Cleaning', 'residential', 'A thorough top-to-bottom clean, ideal for first-time bookings or homes that need extra attention.', 180, 2,
  'Deep Cleaning Troy MI | Detailed Home Cleaning', 'Professional deep cleaning service in Troy, Michigan. Baseboards, buildup, and detail work included.'),
('move-in-cleaning', 'Move-In Cleaning', 'residential', 'A detailed clean of an empty home before you move your belongings in.', 180, 3,
  'Move In Cleaning Troy MI | Move-In Ready Homes', 'Start fresh in your new Troy, MI home with a full move-in cleaning service.'),
('move-out-cleaning', 'Move-Out Cleaning', 'residential', 'A thorough clean to help secure your deposit or prepare a home for its next residents.', 180, 4,
  'Move Out Cleaning Troy MI | Deposit-Ready Cleaning', 'Move-out cleaning in Troy, MI built to help you hand back a spotless home.'),
('apartment-turnover', 'Apartment Turnover Cleaning', 'apartment', 'Fast, consistent turnover cleaning between residents for property managers and leasing offices.', 150, 5,
  'Apartment Turnover Cleaning Troy MI | Property Managers', 'Dependable apartment turnover cleaning for Troy, MI property managers and leasing offices.'),
('office-cleaning', 'Office Cleaning', 'commercial', 'Routine office cleaning covering workstations, common areas, kitchens, and restrooms.', 120, 6,
  'Office Cleaning Troy MI | Commercial Office Cleaning', 'Professional office cleaning services for Troy, MI businesses. Flexible scheduling, consistent quality.'),
('commercial-cleaning', 'Commercial Cleaning', 'commercial', 'General commercial cleaning for retail, medical, and professional spaces.', 150, 7,
  'Commercial Cleaning Troy MI | Business Cleaning Services', 'Commercial cleaning for Troy, MI businesses of all sizes. Request a walkthrough and custom quote.'),
('janitorial-services', 'Janitorial Services', 'commercial', 'Recurring janitorial service for facilities that need ongoing daily, weekly, or nightly coverage.', 120, 8,
  'Janitorial Services Troy MI | Recurring Facility Cleaning', 'Reliable janitorial services in Troy, MI for offices, facilities, and commercial properties.');

-- ---------------------------------------------------------------------------
-- SERVICE ADD-ONS
-- ---------------------------------------------------------------------------
insert into service_addons (slug, name, description, extra_minutes, sort_order) values
('inside-oven', 'Inside Oven', 'Hand-clean the interior of the oven, racks included.', 30, 1),
('inside-fridge', 'Inside Refrigerator', 'Hand-clean the interior of the refrigerator and freezer.', 30, 2),
('inside-cabinets', 'Inside Cabinets', 'Wipe down interior cabinet and drawer surfaces (empty cabinets required).', 45, 3),
('baseboards', 'Baseboards', 'Detailed wipe-down of all baseboards throughout the home.', 30, 4),
('interior-windows', 'Interior Windows', 'Interior glass cleaning for accessible windows.', 30, 5),
('extra-bathroom', 'Extra Bathroom', 'Add an additional bathroom beyond the quoted count.', 20, 6),
('extra-bedroom', 'Extra Bedroom', 'Add an additional bedroom beyond the quoted count.', 15, 7),
('heavy-buildup', 'Heavy Buildup', 'Additional time for homes with significant grime, dust, or neglect buildup.', 45, 8),
('pet-hair', 'Pet Hair Removal', 'Extra attention to pet hair on floors, furniture, and corners.', 20, 9);

-- ---------------------------------------------------------------------------
-- PRICING RULES  (admin-editable — see Admin > Pricing to change any value)
-- ---------------------------------------------------------------------------
-- Base rates
insert into pricing_rules (service_id, rule_type, label, value)
select id, 'base_rate', 'Base price', v from services s
join (values
  ('standard-cleaning', 129.00),
  ('deep-cleaning', 219.00),
  ('move-in-cleaning', 249.00),
  ('move-out-cleaning', 249.00),
  ('apartment-turnover', 159.00),
  ('office-cleaning', 149.00),
  ('commercial-cleaning', 199.00),
  ('janitorial-services', 179.00)
) as base(slug, v) on base.slug = s.slug;

-- Per-bedroom / per-bathroom (residential + apartment only)
insert into pricing_rules (service_id, rule_type, label, value)
select id, 'per_bedroom', 'Per bedroom (beyond 1st)', 15.00 from services
where slug in ('standard-cleaning','deep-cleaning','move-in-cleaning','move-out-cleaning','apartment-turnover');

insert into pricing_rules (service_id, rule_type, label, value)
select id, 'per_bathroom', 'Per bathroom (beyond 1st)', 20.00 from services
where slug in ('standard-cleaning','deep-cleaning','move-in-cleaning','move-out-cleaning','apartment-turnover');

-- Per-500-sqft-block for larger homes
insert into pricing_rules (service_id, rule_type, label, value, unit_size)
select id, 'per_sqft_block', 'Per 500 sq ft (beyond 1500)', 25.00, 500 from services
where slug in ('standard-cleaning','deep-cleaning','move-in-cleaning','move-out-cleaning');

insert into pricing_rules (service_id, rule_type, label, value, unit_size)
select id, 'per_sqft_block', 'Per 1000 sq ft', 40.00, 1000 from services
where slug in ('office-cleaning','commercial-cleaning','janitorial-services','apartment-turnover');

-- Frequency discounts
insert into pricing_rules (service_id, rule_type, label, value, frequency)
select s.id, 'frequency_discount', d.label, d.pct, d.freq::frequency_type
from services s
cross join (values
  ('Weekly discount', 15.00, 'weekly'),
  ('Biweekly discount', 10.00, 'biweekly'),
  ('Monthly discount', 5.00, 'monthly')
) as d(label, pct, freq)
where s.category in ('residential');

-- Condition multipliers (applied as % surcharge for moderate/heavy)
insert into pricing_rules (service_id, rule_type, label, value, condition_key)
select id, 'condition_multiplier', 'Light condition', 0, 'light' from services where category = 'residential'
union all
select id, 'condition_multiplier', 'Moderate condition', 10, 'moderate' from services where category = 'residential'
union all
select id, 'condition_multiplier', 'Heavy condition', 25, 'heavy' from services where category = 'residential';

-- Add-on flat prices
insert into pricing_rules (addon_id, rule_type, label, value)
select id, 'addon_flat', name, v from service_addons
join (values
  ('inside-oven', 35.00),
  ('inside-fridge', 35.00),
  ('inside-cabinets', 45.00),
  ('baseboards', 30.00),
  ('interior-windows', 30.00),
  ('extra-bathroom', 25.00),
  ('extra-bedroom', 20.00),
  ('heavy-buildup', 45.00),
  ('pet-hair', 20.00)
) as v(slug, v) on v.slug = service_addons.slug;

-- Minimum price floors
insert into pricing_rules (service_id, rule_type, label, value)
select id, 'minimum_price', 'Minimum booking price', 99.00 from services where category = 'residential'
union all
select id, 'minimum_price', 'Minimum booking price', 129.00 from services where category in ('commercial','apartment');

-- ---------------------------------------------------------------------------
-- CHECKLIST TEMPLATES (sample — one per service; extend per category as needed)
-- ---------------------------------------------------------------------------
insert into checklist_templates (service_id, item_text, sort_order)
select id, item, ord from services s
cross join lateral (values
  ('Kitchen counters and surfaces wiped down', 1),
  ('Kitchen appliances (exterior) cleaned', 2),
  ('Sink and fixtures scrubbed', 3),
  ('Bathrooms disinfected (toilet, tub/shower, sink)', 4),
  ('Mirrors and glass cleaned', 5),
  ('Floors vacuumed and mopped', 6),
  ('Trash emptied and liners replaced', 7),
  ('Dusting of accessible surfaces', 8),
  ('Beds made / linens straightened (if applicable)', 9),
  ('Final walkthrough completed', 10)
) as t(item, ord)
where s.category in ('residential','apartment');

insert into checklist_templates (service_id, item_text, sort_order)
select id, item, ord from services s
cross join lateral (values
  ('Workstations and desks wiped down', 1),
  ('Trash and recycling emptied', 2),
  ('Restrooms disinfected and restocked', 3),
  ('Common areas / break room cleaned', 4),
  ('Floors vacuumed and mopped', 5),
  ('Glass doors and entryways cleaned', 6),
  ('High-touch points disinfected (handles, switches)', 7),
  ('Final walkthrough completed', 8)
) as t(item, ord)
where s.category = 'commercial';

-- ---------------------------------------------------------------------------
-- MESSAGE TEMPLATES (admin editable in Admin > Messages)
-- ---------------------------------------------------------------------------
insert into message_templates (channel, template_key, name, body) values
('sms', 'booking_confirmation', 'Booking Confirmation', 'Hi {{first_name}}, your {{service_name}} with Troy Premier Green Cleaning is confirmed for {{booking_date}} at {{booking_time}}. Reply STOP to opt out.'),
('sms', 'reminder_24h', '24-Hour Reminder', 'Reminder: your {{service_name}} is tomorrow, {{booking_date}} at {{booking_time}}. Reply if you need to reschedule.'),
('sms', 'cleaner_assigned', 'Cleaner Assigned', '{{cleaner_name}} has been assigned to your {{booking_date}} cleaning. We''ll text you when they''re on the way.'),
('sms', 'cleaner_en_route', 'Cleaner En Route', '{{cleaner_name}} is on the way to your home for your {{booking_date}} cleaning.'),
('sms', 'job_completed', 'Job Completed', 'Your cleaning is complete! Thank you for choosing Troy Premier Green Cleaning. We''d love your feedback.'),
('sms', 'review_request', 'Review Request', 'How did we do? Leave a quick review: {{review_link}}'),
('sms', 'reschedule_confirmation', 'Reschedule Confirmation', 'Your cleaning has been rescheduled to {{booking_date}} at {{booking_time}}.'),
('sms', 'cancellation_confirmation', 'Cancellation Confirmation', 'Your {{booking_date}} cleaning has been cancelled. Contact us any time to rebook.');

insert into message_templates (channel, template_key, name, subject, body) values
('email', 'booking_confirmation', 'Booking Confirmation', 'Your cleaning is confirmed — {{booking_date}}', 'Hi {{first_name}}, thanks for booking with Troy Premier Green Cleaning Co. Your {{service_name}} is confirmed for {{booking_date}} at {{booking_time}}. Total: {{total_price}}.'),
('email', 'payment_receipt', 'Payment Receipt', 'Receipt for your Troy Premier Green Cleaning booking', 'Hi {{first_name}}, this confirms payment of {{amount_paid}} for booking {{booking_number}}.'),
('email', 'reminder_24h', 'Reminder', 'Reminder: cleaning tomorrow', 'Hi {{first_name}}, just a reminder that your cleaning is scheduled for {{booking_date}} at {{booking_time}}.'),
('email', 'cleaner_assigned', 'Cleaner Assigned', 'A cleaner has been assigned to your booking', 'Hi {{first_name}}, {{cleaner_name}} will be handling your {{booking_date}} cleaning.'),
('email', 'job_completed', 'Job Completed', 'Your cleaning is complete', 'Hi {{first_name}}, your {{service_name}} is complete. Thank you for choosing us!'),
('email', 'review_request', 'Review Request', 'How did we do?', 'Hi {{first_name}}, we''d love to hear about your experience: {{review_link}}'),
('email', 'commercial_quote_request', 'Commercial Quote Request', 'We received your commercial cleaning request', 'Hi {{contact_name}}, thanks for reaching out about cleaning for {{company_name}}. Our team will follow up shortly to schedule a walkthrough.');

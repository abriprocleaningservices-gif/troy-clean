export type ServiceCategory = "residential" | "commercial" | "apartment";
export type FrequencyType = "one_time" | "weekly" | "biweekly" | "monthly";
export type PaymentTiming = "full" | "deposit" | "pay_later";
export type ConditionKey = "light" | "moderate" | "heavy";

export type BookingStatus =
  | "requested"
  | "pending_payment"
  | "confirmed"
  | "assigned"
  | "cleaner_en_route"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

export interface Service {
  id: string;
  slug: string;
  name: string;
  category: ServiceCategory;
  description: string | null;
  base_duration_minutes: number;
  is_active: boolean;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
}

export interface ServiceAddon {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  extra_minutes: number;
  is_active: boolean;
  sort_order: number;
}

export type PricingRuleType =
  | "base_rate"
  | "per_bedroom"
  | "per_bathroom"
  | "per_sqft_block"
  | "frequency_discount"
  | "condition_multiplier"
  | "addon_flat"
  | "minimum_price";

export interface PricingRule {
  id: string;
  service_id: string | null;
  addon_id: string | null;
  rule_type: PricingRuleType;
  label: string;
  value: number;
  unit_size: number | null;
  condition_key: ConditionKey | null;
  frequency: FrequencyType | null;
  is_active: boolean;
}

export interface PropertyDetailsInput {
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  frequency: FrequencyType;
  currentCondition: ConditionKey;
  pets: boolean;
  petNotes?: string;
  specialRequests?: string;
}

export interface CommercialDetailsInput {
  squareFootage: number;
  frequency: FrequencyType;
  restroomCount: number;
  specialRequests?: string;
}

export interface PriceBreakdownLine {
  label: string;
  amount: number;
}

export interface PriceBreakdown {
  lines: PriceBreakdownLine[];
  addonLines: PriceBreakdownLine[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  estimatedDurationMinutes: number;
}

export interface CustomerInfoInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zip: string;
  accessInstructions?: string;
  specialInstructions?: string;
}

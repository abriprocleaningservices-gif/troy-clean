import type {
  ConditionKey,
  FrequencyType,
  PriceBreakdown,
  PricingRule,
  PropertyDetailsInput,
  CommercialDetailsInput,
  Service,
  ServiceAddon,
} from "@/types/database";

/**
 * Pricing engine
 * ----------------------------------------------------------------------------
 * Every dollar amount here is looked up from `pricing_rules` (seeded via
 * supabase/seed/seed.sql, editable at Admin > Pricing). This module contains
 * NO hard-coded prices — only the arithmetic for how rule types combine.
 *
 * Rule types and how they're applied:
 *  - base_rate            -> starting price for the service
 *  - per_bedroom           -> value x (bedrooms - 1), floored at 0
 *  - per_bathroom          -> value x (bathrooms - 1), floored at 0
 *  - per_sqft_block        -> value x floor(sqft / unit_size), sqft over a 1500 baseline for residential
 *  - condition_multiplier  -> % surcharge on running subtotal, keyed by condition_key
 *  - frequency_discount    -> % discount on running subtotal, keyed by frequency
 *  - addon_flat            -> flat $ added per selected add-on
 *  - minimum_price         -> price floor enforced after discounts, before tax
 */

const RESIDENTIAL_SQFT_BASELINE = 1500;

export function calculateResidentialPrice(
  service: Service,
  rules: PricingRule[],
  addons: ServiceAddon[],
  selectedAddonIds: string[],
  details: PropertyDetailsInput,
  taxRatePercent: number
): PriceBreakdown {
  const serviceRules = rules.filter((r) => r.service_id === service.id && r.is_active);
  const lines: PriceBreakdown["lines"] = [];

  const baseRate = serviceRules.find((r) => r.rule_type === "base_rate")?.value ?? 0;
  lines.push({ label: `${service.name} — base price`, amount: baseRate });
  let runningSubtotal = baseRate;

  const perBedroomRule = serviceRules.find((r) => r.rule_type === "per_bedroom");
  if (perBedroomRule && details.bedrooms > 1) {
    const amount = perBedroomRule.value * (details.bedrooms - 1);
    lines.push({ label: `Additional bedrooms (${details.bedrooms - 1})`, amount });
    runningSubtotal += amount;
  }

  const perBathroomRule = serviceRules.find((r) => r.rule_type === "per_bathroom");
  if (perBathroomRule && details.bathrooms > 1) {
    const amount = perBathroomRule.value * (details.bathrooms - 1);
    lines.push({ label: `Additional bathrooms (${details.bathrooms - 1})`, amount });
    runningSubtotal += amount;
  }

  const sqftRule = serviceRules.find((r) => r.rule_type === "per_sqft_block");
  if (sqftRule && sqftRule.unit_size && details.squareFootage > RESIDENTIAL_SQFT_BASELINE) {
    const overage = details.squareFootage - RESIDENTIAL_SQFT_BASELINE;
    const blocks = Math.ceil(overage / sqftRule.unit_size);
    const amount = blocks * sqftRule.value;
    lines.push({ label: `Square footage over ${RESIDENTIAL_SQFT_BASELINE} sq ft`, amount });
    runningSubtotal += amount;
  }

  const conditionRule = serviceRules.find(
    (r) => r.rule_type === "condition_multiplier" && r.condition_key === details.currentCondition
  );
  if (conditionRule && conditionRule.value > 0) {
    const amount = round2((runningSubtotal * conditionRule.value) / 100);
    lines.push({ label: `${capitalize(details.currentCondition)} condition surcharge (${conditionRule.value}%)`, amount });
    runningSubtotal += amount;
  }

  // Add-ons priced independently (flat per add-on), summed separately for clarity
  const addonLines: PriceBreakdown["lines"] = [];
  let addonTotal = 0;
  let addonMinutes = 0;
  for (const addonId of selectedAddonIds) {
    const addon = addons.find((a) => a.id === addonId);
    const rule = rules.find((r) => r.addon_id === addonId && r.rule_type === "addon_flat" && r.is_active);
    if (addon && rule) {
      addonLines.push({ label: addon.name, amount: rule.value });
      addonTotal += rule.value;
      addonMinutes += addon.extra_minutes;
    }
  }

  let subtotal = round2(runningSubtotal + addonTotal);

  // Frequency discount applies to the full subtotal including add-ons
  let discountTotal = 0;
  const freqRule = serviceRules.find(
    (r) => r.rule_type === "frequency_discount" && r.frequency === details.frequency
  );
  if (freqRule && details.frequency !== "one_time") {
    discountTotal = round2((subtotal * freqRule.value) / 100);
  }

  let preTaxTotal = round2(subtotal - discountTotal);

  const minRule = serviceRules.find((r) => r.rule_type === "minimum_price");
  if (minRule && preTaxTotal < minRule.value) {
    const bump = round2(minRule.value - preTaxTotal);
    lines.push({ label: "Minimum booking adjustment", amount: bump });
    preTaxTotal = minRule.value;
  }

  const taxTotal = round2((preTaxTotal * taxRatePercent) / 100);
  const total = round2(preTaxTotal + taxTotal);

  return {
    lines,
    addonLines,
    subtotal,
    discountTotal,
    taxTotal,
    total,
    estimatedDurationMinutes: service.base_duration_minutes + addonMinutes,
  };
}

export function calculateCommercialPrice(
  service: Service,
  rules: PricingRule[],
  addons: ServiceAddon[],
  selectedAddonIds: string[],
  details: CommercialDetailsInput,
  taxRatePercent: number
): PriceBreakdown {
  const serviceRules = rules.filter((r) => r.service_id === service.id && r.is_active);
  const lines: PriceBreakdown["lines"] = [];

  const baseRate = serviceRules.find((r) => r.rule_type === "base_rate")?.value ?? 0;
  lines.push({ label: `${service.name} — base price`, amount: baseRate });
  let runningSubtotal = baseRate;

  const sqftRule = serviceRules.find((r) => r.rule_type === "per_sqft_block");
  if (sqftRule && sqftRule.unit_size && details.squareFootage > 0) {
    const blocks = Math.ceil(details.squareFootage / sqftRule.unit_size);
    const amount = blocks * sqftRule.value;
    lines.push({ label: `Square footage (${details.squareFootage.toLocaleString()} sq ft)`, amount });
    runningSubtotal += amount;
  }

  const addonLines: PriceBreakdown["lines"] = [];
  let addonTotal = 0;
  let addonMinutes = 0;
  for (const addonId of selectedAddonIds) {
    const addon = addons.find((a) => a.id === addonId);
    const rule = rules.find((r) => r.addon_id === addonId && r.rule_type === "addon_flat" && r.is_active);
    if (addon && rule) {
      addonLines.push({ label: addon.name, amount: rule.value });
      addonTotal += rule.value;
      addonMinutes += addon.extra_minutes;
    }
  }

  let subtotal = round2(runningSubtotal + addonTotal);

  let discountTotal = 0;
  const freqRule = serviceRules.find(
    (r) => r.rule_type === "frequency_discount" && r.frequency === details.frequency
  );
  if (freqRule && details.frequency !== "one_time") {
    discountTotal = round2((subtotal * freqRule.value) / 100);
  }

  let preTaxTotal = round2(subtotal - discountTotal);

  const minRule = serviceRules.find((r) => r.rule_type === "minimum_price");
  if (minRule && preTaxTotal < minRule.value) {
    preTaxTotal = minRule.value;
  }

  const taxTotal = round2((preTaxTotal * taxRatePercent) / 100);
  const total = round2(preTaxTotal + taxTotal);

  return {
    lines,
    addonLines,
    subtotal,
    discountTotal,
    taxTotal,
    total,
    estimatedDurationMinutes: service.base_duration_minutes + addonMinutes,
  };
}

export function paymentAmountDue(
  total: number,
  timing: "full" | "deposit" | "pay_later",
  depositPercent: number
): number {
  if (timing === "full") return total;
  if (timing === "deposit") return round2((total * depositPercent) / 100);
  return 0; // pay_later — nothing collected online
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export type { ConditionKey, FrequencyType };

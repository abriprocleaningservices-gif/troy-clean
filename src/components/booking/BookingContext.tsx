import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  calculateResidentialPrice,
  calculateCommercialPrice,
  paymentAmountDue,
} from "@/lib/pricingEngine";
import type {
  CommercialDetailsInput,
  ConditionKey,
  CustomerInfoInput,
  FrequencyType,
  PaymentTiming,
  PriceBreakdown,
  PricingRule,
  PropertyDetailsInput,
  Service,
  ServiceAddon,
} from "@/types/database";

export const TOTAL_STEPS = 8;

interface BookingState {
  step: number;
  service: Service | null;
  residentialDetails: PropertyDetailsInput;
  commercialDetails: CommercialDetailsInput;
  selectedAddonIds: string[];
  scheduledDate: string | null;
  scheduledTime: string | null;
  customer: CustomerInfoInput;
  paymentTiming: PaymentTiming;
}

interface BookingContextValue {
  state: BookingState;
  services: Service[];
  addons: ServiceAddon[];
  rules: PricingRule[];
  loading: boolean;
  taxRatePercent: number;
  depositPercent: number;
  priceBreakdown: PriceBreakdown | null;
  amountDueNow: number;
  bookingId: string | null;
  bookingNumber: string | null;
  creatingBooking: boolean;
  createBookingError: string | null;
  setStep: (step: number) => void;
  next: () => void;
  back: () => void;
  selectService: (service: Service) => void;
  updateResidentialDetails: (patch: Partial<PropertyDetailsInput>) => void;
  updateCommercialDetails: (patch: Partial<CommercialDetailsInput>) => void;
  toggleAddon: (addonId: string) => void;
  setSchedule: (date: string, time: string) => void;
  updateCustomer: (patch: Partial<CustomerInfoInput>) => void;
  setPaymentTiming: (timing: PaymentTiming) => void;
  createBookingRecord: () => Promise<{ id: string; bookingNumber: string } | null>;
}

const DEFAULT_RESIDENTIAL: PropertyDetailsInput = {
  bedrooms: 2,
  bathrooms: 1,
  squareFootage: 1200,
  frequency: "one_time",
  currentCondition: "light",
  pets: false,
};

const DEFAULT_COMMERCIAL: CommercialDetailsInput = {
  squareFootage: 2000,
  frequency: "weekly",
  restroomCount: 2,
};

const DEFAULT_CUSTOMER: CustomerInfoInput = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  city: "Troy",
  zip: "",
};

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<Service[]>([]);
  const [addons, setAddons] = useState<ServiceAddon[]>([]);
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [taxRatePercent, setTaxRatePercent] = useState(6);
  const [depositPercent, setDepositPercent] = useState(25);
  const [loading, setLoading] = useState(true);

  const [state, setState] = useState<BookingState>({
    step: 1,
    service: null,
    residentialDetails: DEFAULT_RESIDENTIAL,
    commercialDetails: DEFAULT_COMMERCIAL,
    selectedAddonIds: [],
    scheduledDate: null,
    scheduledTime: null,
    customer: DEFAULT_CUSTOMER,
    paymentTiming: "full",
  });

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const [servicesRes, addonsRes, rulesRes, settingsRes] = await Promise.all([
        supabase.from("services").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("service_addons").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("pricing_rules").select("*").eq("is_active", true),
        supabase.from("site_settings").select("tax_rate_percentage, deposit_percentage").single(),
      ]);
      if (!mounted) return;
      if (servicesRes.data) setServices(servicesRes.data as Service[]);
      if (addonsRes.data) setAddons(addonsRes.data as ServiceAddon[]);
      if (rulesRes.data) setRules(rulesRes.data as PricingRule[]);
      if (settingsRes.data) {
        setTaxRatePercent(Number(settingsRes.data.tax_rate_percentage));
        setDepositPercent(Number(settingsRes.data.deposit_percentage));
      }
      setLoading(false);
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const priceBreakdown = useMemo<PriceBreakdown | null>(() => {
    if (!state.service || loading) return null;
    if (state.service.category === "residential" || state.service.category === "apartment") {
      return calculateResidentialPrice(
        state.service,
        rules,
        addons,
        state.selectedAddonIds,
        state.residentialDetails,
        taxRatePercent
      );
    }
    return calculateCommercialPrice(
      state.service,
      rules,
      addons,
      state.selectedAddonIds,
      state.commercialDetails,
      taxRatePercent
    );
  }, [state.service, state.selectedAddonIds, state.residentialDetails, state.commercialDetails, rules, addons, taxRatePercent, loading]);

  const amountDueNow = priceBreakdown
    ? paymentAmountDue(priceBreakdown.total, state.paymentTiming, depositPercent)
    : 0;

  const [bookingId, setBookingId] = useState<string | null>(null);
  const [bookingNumber, setBookingNumber] = useState<string | null>(null);
  const [creatingBooking, setCreatingBooking] = useState(false);
  const [createBookingError, setCreateBookingError] = useState<string | null>(null);

  async function createBookingRecord(): Promise<{ id: string; bookingNumber: string } | null> {
    if (bookingId && bookingNumber) return { id: bookingId, bookingNumber };
    if (!state.service || !priceBreakdown || !state.scheduledDate || !state.scheduledTime) {
      setCreateBookingError("Booking is missing required details.");
      return null;
    }

    setCreatingBooking(true);
    setCreateBookingError(null);
    try {
      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .upsert(
          {
            first_name: state.customer.firstName,
            last_name: state.customer.lastName,
            email: state.customer.email,
            phone: state.customer.phone,
          },
          { onConflict: "email" }
        )
        .select("id")
        .single();
      if (customerError || !customer) throw customerError ?? new Error("Could not create customer");

      const { data: property, error: propertyError } = await supabase
        .from("properties")
        .insert({
          customer_id: customer.id,
          address_line1: state.customer.address,
          city: state.customer.city,
          zip: state.customer.zip,
          access_instructions: state.customer.accessInstructions || null,
          bedrooms: state.service.category === "commercial" ? null : state.residentialDetails.bedrooms,
          bathrooms: state.service.category === "commercial" ? null : state.residentialDetails.bathrooms,
          square_footage:
            state.service.category === "commercial"
              ? state.commercialDetails.squareFootage
              : state.residentialDetails.squareFootage,
          pets: state.service.category === "commercial" ? false : state.residentialDetails.pets,
          pet_notes: state.residentialDetails.petNotes || null,
        })
        .select("id")
        .single();
      if (propertyError || !property) throw propertyError ?? new Error("Could not create property");

      const frequency =
        state.service.category === "commercial" ? state.commercialDetails.frequency : state.residentialDetails.frequency;
      const currentCondition =
        state.service.category === "commercial" ? null : state.residentialDetails.currentCondition;
      const specialRequests =
        state.service.category === "commercial"
          ? state.commercialDetails.specialRequests
          : state.residentialDetails.specialRequests;

      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          customer_id: customer.id,
          property_id: property.id,
          service_id: state.service.id,
          status: "pending_payment",
          frequency,
          scheduled_date: state.scheduledDate,
          scheduled_start_time: state.scheduledTime,
          estimated_duration_minutes: priceBreakdown.estimatedDurationMinutes,
          current_condition: currentCondition,
          special_requests: (specialRequests || state.customer.specialInstructions) ?? null,
          subtotal: priceBreakdown.subtotal,
          discount_total: priceBreakdown.discountTotal,
          tax_total: priceBreakdown.taxTotal,
          total_price: priceBreakdown.total,
          payment_timing: state.paymentTiming,
          payment_status: "pending",
        })
        .select("id, booking_number")
        .single();
      if (bookingError || !booking) throw bookingError ?? new Error("Could not create booking");

      const items = [
        ...priceBreakdown.lines.map((l) => ({
          booking_id: booking.id,
          description: l.label,
          quantity: 1,
          unit_price: l.amount,
          line_total: l.amount,
        })),
        ...priceBreakdown.addonLines.map((l, idx) => ({
          booking_id: booking.id,
          addon_id: state.selectedAddonIds[idx] ?? null,
          description: l.label,
          quantity: 1,
          unit_price: l.amount,
          line_total: l.amount,
        })),
      ];
      if (items.length) {
        await supabase.from("booking_items").insert(items);
      }

      setBookingId(booking.id);
      setBookingNumber(booking.booking_number);
      return { id: booking.id, bookingNumber: booking.booking_number };
    } catch (err) {
      setCreateBookingError(err instanceof Error ? err.message : "Something went wrong creating your booking.");
      return null;
    } finally {
      setCreatingBooking(false);
    }
  }

  const value: BookingContextValue = {
    state,
    services,
    addons,
    rules,
    loading,
    taxRatePercent,
    depositPercent,
    priceBreakdown,
    amountDueNow,
    bookingId,
    bookingNumber,
    creatingBooking,
    createBookingError,
    createBookingRecord,
    setStep: (step) => setState((s) => ({ ...s, step })),
    next: () => setState((s) => ({ ...s, step: Math.min(s.step + 1, TOTAL_STEPS) })),
    back: () => setState((s) => ({ ...s, step: Math.max(s.step - 1, 1) })),
    selectService: (service) => setState((s) => ({ ...s, service })),
    updateResidentialDetails: (patch) =>
      setState((s) => ({ ...s, residentialDetails: { ...s.residentialDetails, ...patch } })),
    updateCommercialDetails: (patch) =>
      setState((s) => ({ ...s, commercialDetails: { ...s.commercialDetails, ...patch } })),
    toggleAddon: (addonId) =>
      setState((s) => ({
        ...s,
        selectedAddonIds: s.selectedAddonIds.includes(addonId)
          ? s.selectedAddonIds.filter((id) => id !== addonId)
          : [...s.selectedAddonIds, addonId],
      })),
    setSchedule: (date, time) => setState((s) => ({ ...s, scheduledDate: date, scheduledTime: time })),
    updateCustomer: (patch) => setState((s) => ({ ...s, customer: { ...s.customer, ...patch } })),
    setPaymentTiming: (timing) => setState((s) => ({ ...s, paymentTiming: timing })),
  };

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used inside BookingProvider");
  return ctx;
}

export type { ConditionKey, FrequencyType };

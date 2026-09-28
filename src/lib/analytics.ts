/**
 * Thin analytics wrapper. Ships as integration points only — wire your real
 * GA4 / Meta Pixel snippet IDs via VITE_GA_MEASUREMENT_ID / VITE_META_PIXEL_ID
 * in .env, then call track() from anywhere in the app.
 */
type AnalyticsEvent =
  | "booking_started"
  | "service_selected"
  | "quote_generated"
  | "checkout_started"
  | "payment_completed"
  | "booking_completed"
  | "quote_request"
  | "commercial_lead"
  | "phone_click"
  | "email_click";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function track(event: AnalyticsEvent, params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;

  if (window.gtag) {
    window.gtag("event", event, params);
  }
  if (window.fbq) {
    window.fbq("trackCustom", event, params);
  }
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug("[analytics]", event, params);
  }
}

export function initAnalytics(): void {
  const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
  const pixelId = import.meta.env.VITE_META_PIXEL_ID as string | undefined;

  if (gaId && !document.getElementById("ga4-script")) {
    const script = document.createElement("script");
    script.id = "ga4-script";
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer!.push(args);
    };
    window.gtag("js", new Date());
    window.gtag("config", gaId);
  }

  if (pixelId && !document.getElementById("meta-pixel-script")) {
    // Meta Pixel base code is intentionally left as a placeholder — paste the
    // official snippet from Events Manager here, referencing VITE_META_PIXEL_ID.
    // eslint-disable-next-line no-console
    console.info("Meta Pixel ID configured:", pixelId, "— add the official base snippet before launch.");
  }
}

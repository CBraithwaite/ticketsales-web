/**
 * Client-side service-fee estimate shown before checkout. The server
 * (FeeCalculator in the backend) is the source of truth at payment time —
 * keep these values in sync with the backend's Checkout config section.
 */
export const FEE_PERCENT = 2.99;

/** Fixed per-ticket fee — CAD 1.20 equivalents, keyed by ISO currency. */
export const PER_TICKET_FEE: Record<string, number> = {
  CAD: 1.2,
  JMD: 140,
  USD: 0.9,
  TTD: 6,
  BBD: 1.8,
  GBP: 0.7,
};

export interface FeeParts {
  /** 2.99% of the subtotal — shown as "Credit card processing". */
  processing: number;
  /** Fixed per-ticket amount — shown as "Service fee". */
  service: number;
  total: number;
}

/** Fee = 2.99% card processing + fixed amount per ticket. Free orders stay free. */
export function estimateFeeParts(
  subtotal: number,
  ticketCount: number,
  currency: string,
): FeeParts {
  if (subtotal <= 0) return { processing: 0, service: 0, total: 0 };
  // subtotal × 2.99 is the fee in cents; snap float noise (1150 × 2.99 =
  // 3438.4999…) before rounding so .005 boundaries round away from zero like
  // the backend's decimal.Round — otherwise the shown total can be a cent
  // below the charged amount.
  const processing = Math.round(Number((subtotal * FEE_PERCENT).toFixed(4))) / 100;
  const service = (PER_TICKET_FEE[currency] ?? 0) * ticketCount;
  return { processing, service, total: processing + service };
}

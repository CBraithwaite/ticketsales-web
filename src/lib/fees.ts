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
  const processing = Math.round(subtotal * (FEE_PERCENT / 100) * 100) / 100;
  const service = (PER_TICKET_FEE[currency] ?? 0) * ticketCount;
  return { processing, service, total: processing + service };
}

/** Combined fee amount (processing + service). */
export function estimateServiceFee(
  subtotal: number,
  ticketCount: number,
  currency: string,
): number {
  return estimateFeeParts(subtotal, ticketCount, currency).total;
}

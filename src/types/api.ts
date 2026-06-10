/**
 * API types. Structural shapes come from `api.generated.ts` (run `npm run
 * gen:api` against the running backend to refresh after API changes) — only
 * enum narrowing and frontend-only constants live here. C# enums serialize as
 * plain strings in the OpenAPI spec, so we re-narrow those fields by hand.
 *
 * A few admin/promo types near the bottom are still hand-written because
 * their endpoints don't declare response types yet.
 */
import type { components } from './api.generated';

export type Schemas = components['schemas'];

// ---- Enum narrowings (keep in sync with backend enums) -----------------------

export type EventStatus = 'Draft' | 'Published' | 'Unlisted' | 'Cancelled' | 'Completed';
export type EventType = 'SingleDate' | 'Series';
export type Currency = 'JMD' | 'USD' | 'TTD' | 'BBD' | 'CAD' | 'GBP' | 'EUR';
export type OrderStatus =
  | 'Pending' | 'Paid' | 'Failed' | 'Refunded' | 'PartiallyRefunded' | 'Cancelled' | 'Expired';
export type RefundStatus = 'Requested' | 'Approved' | 'Rejected' | 'Processing' | 'Completed' | 'Failed';
export type PayoutStatus = 'Pending' | 'Processing' | 'Paid' | 'Failed';
export type VerificationStatus = 'Pending' | 'UnderReview' | 'Approved' | 'Rejected' | 'Suspended';

// ---- Generated-backed response types -----------------------------------------

export type OrganizerResponse = Omit<Schemas['OrganizerResponse'], 'verificationStatus'> & {
  verificationStatus: VerificationStatus;
};

export type TierResponse = Omit<Schemas['TierResponse'], 'currency'> & {
  currency: Currency;
};

export type OccurrenceResponse = Omit<
  Schemas['OccurrenceResponse'],
  'status' | 'lowestPriceCurrency' | 'tiers'
> & {
  status: 'Scheduled' | 'Cancelled';
  lowestPriceCurrency: Currency;
  tiers: TierResponse[];
};

export type EventListItem = Omit<
  Schemas['EventListItem'],
  'status' | 'type' | 'lowestPriceCurrency'
> & {
  status: EventStatus;
  type: EventType;
  lowestPriceCurrency: Currency;
};

export type EventDetail = Omit<
  Schemas['EventDetail'],
  'status' | 'type' | 'tiers' | 'occurrences'
> & {
  status: EventStatus;
  type: EventType;
  tiers: TierResponse[];
  occurrences: OccurrenceResponse[] | null;
};

/** Which payment methods the server has configured (GET /checkout/payment-methods). */
export type PaymentMethods = Schemas['PaymentMethodsResponse'];

export type OrganizerRefundSummary = Omit<Schemas['OrganizerRefundSummary'], 'status'> & {
  status: RefundStatus;
};

export type TicketBrief = Schemas['TicketBrief'];

export type OrderSummary = Omit<Schemas['OrderSummary'], 'status' | 'tickets'> & {
  status: OrderStatus;
  tickets: TicketBrief[];
};

export type BankTransferReserveResponse = Schemas['BankTransferReserveResponse'];

export type PayoutEventSummary = Schemas['PayoutEventSummary'];

export type PayoutResponse = Omit<Schemas['PayoutResponse'], 'status'> & {
  status: PayoutStatus;
};

// My Tickets / sharing / dashboard (new typed endpoints)
export type MyTicketOrder = Schemas['MyTicketOrder'];
export type MyTicketRow = Schemas['MyTicketRow'];
export type SendTicketResponse = Schemas['SendTicketResponse'];
export type EmailTicketsResponse = Schemas['EmailTicketsResponse'];
export type TicketViewItem = Schemas['TicketViewItem'];
export type TicketViewResponse = Schemas['TicketViewResponse'];
export type CurrencyAmount = Schemas['CurrencyAmount'];
export type OrganizerStatsResponse = Schemas['OrganizerStatsResponse'];

// ---- Constants matching backend enums (order matters where it matters) -------

export const COUNTRIES = [
  'Jamaica',
  'TrinidadAndTobago',
  'Barbados',
  'UnitedStates',
  'Canada',
  'UnitedKingdom',
] as const;

export type Country = typeof COUNTRIES[number];

export const COUNTRY_LABELS: Record<Country, string> = {
  Jamaica: 'Jamaica',
  TrinidadAndTobago: 'Trinidad & Tobago',
  Barbados: 'Barbados',
  UnitedStates: 'United States',
  Canada: 'Canada',
  UnitedKingdom: 'United Kingdom',
};

/** Default currency + IANA time zone per country (mirrors backend CountryDefaults). */
export const COUNTRY_DEFAULTS: Record<Country, { currency: 'JMD' | 'USD' | 'TTD' | 'BBD' | 'CAD' | 'GBP'; timeZone: string }> = {
  Jamaica: { currency: 'JMD', timeZone: 'America/Jamaica' },
  TrinidadAndTobago: { currency: 'TTD', timeZone: 'America/Port_of_Spain' },
  Barbados: { currency: 'BBD', timeZone: 'America/Barbados' },
  UnitedStates: { currency: 'USD', timeZone: 'America/New_York' },
  Canada: { currency: 'CAD', timeZone: 'America/Toronto' },
  UnitedKingdom: { currency: 'GBP', timeZone: 'Europe/London' },
};

export const CATEGORIES = [
  'Concert',
  'Dancehall',
  'Reggae',
  'StageShow',
  'Party',
  'Festival',
  'Comedy',
  'Sports',
  'Other',
] as const;

export const CATEGORY_LABELS: Record<typeof CATEGORIES[number], string> = {
  Concert: 'Concert',
  Dancehall: 'Dancehall',
  Reggae: 'Reggae',
  StageShow: 'Stage Show',
  Party: 'Party',
  Festival: 'Festival',
  Comedy: 'Comedy',
  Sports: 'Sports',
  Other: 'Other',
};

// ---- Hand-written (endpoints without declared response types yet) ------------

export interface AdminPayoutItem {
  id: string;
  organizerName: string;
  eventName: string | null;
  periodStart: string;
  periodEnd: string;
  netAmount: number;
  currency: string;
  status: string;
  scheduledAt: string;
  bankRef: string | null;
}

export interface AdminBankTransferOrderItem {
  orderNumber: string;
  buyerName: string;
  buyerEmail: string;
  eventName: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
  expiresAt: string | null;
}

export interface PromoCodeResponse {
  id: string;
  code: string;
  discountType: 'Percentage' | 'FixedAmount';
  discountValue: number;
  discountCurrency: string | null;
  maxUses: number | null;
  currentUses: number;
  validFrom: string | null;
  validUntil: string | null;
  isActive: boolean;
  isCurrentlyValid: boolean;
  applicableTiers: { tierId: string; tierName: string }[];
  createdAt: string;
}

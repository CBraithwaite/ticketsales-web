/**
 * Shared API DTOs that mirror the C# response shapes.
 * Keep these in sync with backend/TicketSales.Api/Endpoints/Dtos/*.
 */

export interface OrganizerResponse {
  id: string;
  businessName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  taxRegistrationNumber: string | null;
  verificationStatus: 'Pending' | 'UnderReview' | 'Approved' | 'Rejected' | 'Suspended';
  verifiedAt: string | null;
  payoutBankName: string | null;
  payoutBankAccountLast4: string | null;
  payoutCurrency: string;
}

export type EventType = 'SingleDate' | 'Series';

export type Currency = 'JMD' | 'USD' | 'TTD' | 'BBD' | 'CAD' | 'GBP' | 'EUR';

export interface TierResponse {
  id: string;
  name: string;
  description: string | null;
  priceAmount: number;
  currency: Currency;
  inventoryTotal: number;
  inventorySold: number;
  inventoryReserved: number;
  inventoryAvailable: number;
  minPerOrder: number;
  maxPerOrder: number;
  isTransferable: boolean;
  isRefundable: boolean;
  saleStartsAt: string | null;
  saleEndsAt: string | null;
  displayOrder: number;
  occurrenceId: string | null;
}

export interface OccurrenceResponse {
  id: string;
  startsAt: string;
  endsAt: string;
  doorsAt: string | null;
  label: string | null;
  status: 'Scheduled' | 'Cancelled';
  displayOrder: number;
  tiers: TierResponse[];
  remainingInventory: number;
  lowestPriceAmount: number;
  lowestPriceCurrency: Currency;
}

export interface EventListItem {
  id: string;
  slug: string;
  name: string;
  category: string;
  status: 'Draft' | 'Published' | 'Unlisted' | 'Cancelled' | 'Completed';
  country: string;
  venueName: string;
  startsAt: string;
  endsAt: string;
  coverImageUrl: string | null;
  lowestPriceAmount: number;
  lowestPriceCurrency: Currency;
  totalInventory: number;
  remainingInventory: number;
  timeZone: string;
  type: EventType;
  occurrenceCount: number;
}

export interface EventDetail {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  status: EventListItem['status'];
  country: string;
  venueName: string;
  venueAddress: string;
  startsAt: string;
  endsAt: string;
  doorsAt: string | null;
  ageRestriction: string | null;
  dressCode: string | null;
  coverImageUrl: string | null;
  galleryUrls: string[];
  timeZone: string;
  organizer: { id: string; businessName: string };
  tiers: TierResponse[];
  type: EventType;
  occurrences: OccurrenceResponse[] | null;
}

/** Which payment methods the server has configured (GET /checkout/payment-methods). */
export interface PaymentMethods {
  card: boolean;
  wiPay: boolean;
  bank: boolean;
}

export interface OrganizerRefundSummary {
  id: string;
  orderNumber: string;
  buyerName: string;
  status: 'Requested' | 'Approved' | 'Rejected' | 'Processing' | 'Refunded';
  amount: number;
  currency: string;
  reason: string;
  requestedAt: string;
  resolvedAt: string | null;
}

/** Constants matching backend enums (order matters where it matters). */
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

export interface TicketBrief {
  id: string;
  status: string;
  tierId: string;
  tierName: string;
  holderName: string;
  qrPayload: string;
}

export interface OrderSummary {
  orderNumber: string;
  status: 'Pending' | 'Paid' | 'Failed' | 'Refunded' | 'PartiallyRefunded' | 'Cancelled' | 'Expired';
  subtotalAmount: number;
  feesAmount: number;
  totalAmount: number;
  currency: string;
  expiresAt: string | null;
  paidAt: string | null;
  buyerEmail: string;
  buyerName: string;
  event: { id: string; slug: string; name: string; startsAt: string; venueName: string; timeZone: string };
  tickets: TicketBrief[];
}

// ---- Bank Transfer ----------------------------------------------------------

export interface BankTransferReserveResponse {
  orderNumber: string;
  confirmationToken: string;
  expiresAt: string;
  subtotalAmount: number;
  feesAmount: number;
  totalAmount: number;
  currency: string;
  bankDetails: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    routingNumber: string | null;
    branch: string | null;
  };
  paymentMemo: string;
}

// ---- Payouts ----------------------------------------------------------------

export interface PayoutEventSummary {
  eventId: string;
  eventName: string;
  eventDate: string;
  ticketsSold: number;
  grossAmount: number;
  feesAmount: number;
  netAmount: number;
  eligibleAmount: number;
  pendingPayoutAmount: number;
  paidOutAmount: number;
  currency: string;
}

export interface PayoutResponse {
  id: string;
  eventId: string | null;
  eventName: string | null;
  periodStart: string;
  periodEnd: string;
  grossAmount: number;
  feeAmount: number;
  netAmount: number;
  currency: string;
  status: 'Pending' | 'Processing' | 'Paid' | 'Failed';
  bankRef: string | null;
  scheduledAt: string;
  paidAt: string | null;
}

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

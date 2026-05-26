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

export interface TierResponse {
  id: string;
  name: string;
  description: string | null;
  priceAmount: number;
  currency: 'JMD' | 'USD';
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
}

export interface EventListItem {
  id: string;
  slug: string;
  name: string;
  category: string;
  status: 'Draft' | 'Published' | 'Unlisted' | 'Cancelled' | 'Completed';
  parish: string;
  venueName: string;
  startsAt: string;
  endsAt: string;
  coverImageUrl: string | null;
  lowestPriceAmount: number;
  lowestPriceCurrency: 'JMD' | 'USD';
  totalInventory: number;
  remainingInventory: number;
}

export interface EventDetail {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  status: EventListItem['status'];
  parish: string;
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
export const PARISHES = [
  'Kingston',
  'StAndrew',
  'StCatherine',
  'Clarendon',
  'Manchester',
  'StElizabeth',
  'Westmoreland',
  'Hanover',
  'StJames',
  'Trelawny',
  'StAnn',
  'StMary',
  'Portland',
  'StThomas',
] as const;

export const PARISH_LABELS: Record<typeof PARISHES[number], string> = {
  Kingston: 'Kingston',
  StAndrew: 'St. Andrew',
  StCatherine: 'St. Catherine',
  Clarendon: 'Clarendon',
  Manchester: 'Manchester',
  StElizabeth: 'St. Elizabeth',
  Westmoreland: 'Westmoreland',
  Hanover: 'Hanover',
  StJames: 'St. James',
  Trelawny: 'Trelawny',
  StAnn: 'St. Ann',
  StMary: 'St. Mary',
  Portland: 'Portland',
  StThomas: 'St. Thomas',
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
  event: { id: string; slug: string; name: string; startsAt: string; venueName: string };
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

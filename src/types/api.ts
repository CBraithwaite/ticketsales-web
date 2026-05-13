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
  timeZone: string;
  organizer: { id: string; businessName: string };
  tiers: TierResponse[];
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

export type BoycottEntry = {
  id: string;
  rank: number;
  company: string;
  product: string;
  reason: string;
  country?: string;
  description?: string;
  status?: string;
  source?: string;
  sourceUrl?: string;
  date?: string;
  confidence?: 'high' | 'medium' | 'low';
  campaignType?: string;
};

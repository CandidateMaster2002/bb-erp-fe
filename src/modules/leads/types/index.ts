export type LeadStage = 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';
export type LeadPriority = 'Low' | 'Medium' | 'High';

export interface Category {
  id: string;
  name: string;
  parentId?: string;
  children?: Category[];
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  company?: string;
  categoryId: string;
  categoryName?: string;
  stage: LeadStage;
  priority: LeadPriority;
  tags: string[];
  notes: string;
  nextFollowUpDate?: string; // ISO Date
  lastContactedDate?: string; // ISO Date
  createdAt: string;
}

export interface FollowUp {
  id: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  note: string;
  dueDate: string; // ISO Date
  status: 'Pending' | 'Completed' | 'Snoozed';
  type: 'Call' | 'WhatsApp' | 'Email' | 'Other';
  repeat?: 'never' | '7' | '15' | '30' | 'custom';
  repeatCustomDays?: number;
}

export interface SavedFilter {
  id: string;
  name: string;
  filters: any; // The payload of filters
}

export interface Interaction {
  id: string;
  leadId: string;
  type: 'Call' | 'WhatsApp' | 'Email' | 'Meeting' | 'Note';
  summary: string;
  outcome?: string;
  date: string; // ISO Date
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export type LeadStage = 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';
export type LeadPriority = 'HOT' | 'WARM' | 'COLD';

export interface Category {
  id: string | number;
  name: string;
  parentId?: string;
  children?: Category[];
}

export interface Lead {
  id: string;
  fullName: string;
  mobileNumber?: string;
  company?: string;
  jobTitle?: string;
  linkedinUrl?: string;
  profilePictureUrl?: string;
  categoryId: string;
  categoryName?: string;
  stageName: LeadStage;
  priority: LeadPriority;
  tags: string[];
  remark: string;
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
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

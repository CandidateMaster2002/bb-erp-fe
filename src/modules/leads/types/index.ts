
export type LeadPriority = 'HOT' | 'WARM' | 'COLD';

export interface CategoryValue {
  id: string | number;
  name: string;
}

export interface CategoryGroup {
  id: string | number;
  name: string;
  values: CategoryValue[];
}



export interface Lead {
  id: string;
  fullName: string;
  mobileNumber?: string;
  company?: string;
  jobTitle?: string;
  linkedinUrl?: string;
  profilePictureUrl?: string;
  categories?: CategoryValue[];
  priority: LeadPriority;
  tags: string[];
  remark: string;
  nextFollowUpDate?: string; // ISO Date
  lastContactedDate?: string; // ISO Date
  createdAt: string;
}

export type ActionStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface LeadLog {
  id: string | number;
  leadId: string | number;
  leadName?: string;
  comment?: string;
  nextAction?: string;
  nextActionDate?: string;
  actionStatus?: ActionStatus;
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

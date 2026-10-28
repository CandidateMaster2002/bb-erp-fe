
export type LeadPriority = 'HOT' | 'WARM' | 'COLD';

export interface CategoryValue {
  id: string | number;
  name: string;
}

export interface CategoryGroup {
  id: string | number;
  categoryType?: 'LEAD' | 'COLLABORATOR';
  name: string;
  values: CategoryValue[];
}



export interface Tag {
  id: number;
  name: string;
  leadCount?: number;
}

export interface Education {
  id: string | number;
  college?: string;
  degree?: string;
  branch?: string;
  batchStart?: string;
  batchEnd?: string;
}

export interface Lead {
  id: string;
  recordType?: 'LEAD' | 'COLLABORATOR';
  fullName: string;
  headline?: string;
  summary?: string;
  city?: string;
  state?: string;
  country?: string;
  location?: string;
  personalEmail?: string;
  mobileNumber?: string;
  mobileUpdatedAt?: string;
  company?: string;
  jobTitle?: string;
  linkedinUrl?: string;
  profilePictureUrl?: string;
  categories?: CategoryValue[];
  education?: Education[];
  priority: LeadPriority;
  tags?: (Tag | string)[];
  tagNames?: string[];
  tagIds?: number[];
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
  mobileNumber?: string;
  linkedinUrl?: string;
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
  id: string | number;
  name: string;
  filterJson?: string;
  filters?: {
    path?: string;
    recordType?: 'LEAD' | 'COLLABORATOR';
    search?: string;
    hasMobileNo?: boolean;
    mobileUpdatedToday?: boolean;
    categoryIds?: Record<string, string>;
    tagIds?: number[];
  };
  createdAt?: string;
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

export interface LeadLink {
  id: number;
  title: string;
  url: string;
  description?: string;
}

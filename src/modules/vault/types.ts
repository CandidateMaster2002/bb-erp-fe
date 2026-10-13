export type VaultCategory = 'IDEA' | 'ASPIRATION' | 'TO_BUY' | 'NOTE';

export interface VaultItem {
  id: number;
  title: string;
  description?: string;
  category: VaultCategory | string;
  link?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVaultItemPayload {
  title: string;
  description?: string;
  category?: VaultCategory | string;
  link?: string;
  isArchived?: boolean;
}

export interface PromoteVaultPayload {
  timeHorizon?: 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'SOMEDAY';
  deadline?: string | null;
  archiveVaultItem?: boolean;
}

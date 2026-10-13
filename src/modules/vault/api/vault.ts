import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../shared/api/client';
import type { VaultItem, CreateVaultItemPayload, PromoteVaultPayload } from '../types';
import { taskKeys } from '../../actions/api/tasks';

export const vaultKeys = {
  all: ['vault'] as const,
  list: (category?: string, includeArchived?: boolean) => [...vaultKeys.all, 'list', category || 'all', !!includeArchived] as const,
  detail: (id: number | string) => [...vaultKeys.all, 'detail', id.toString()] as const,
};

export const useVaultItems = (category?: string, includeArchived?: boolean) => useQuery({
  queryKey: vaultKeys.list(category, includeArchived),
  queryFn: async () => {
    const params: Record<string, any> = {};
    if (category) params.category = category;
    if (includeArchived !== undefined) params.includeArchived = includeArchived;
    return (await api.get<VaultItem[]>('/vault', { params })).data;
  }
});

export const useCreateVaultItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateVaultItemPayload) => (await api.post<VaultItem>('/vault', payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: vaultKeys.all })
  });
};

export const useUpdateVaultItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number | string; data: Partial<CreateVaultItemPayload> }) =>
      (await api.put<VaultItem>(`/vault/${id}`, data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: vaultKeys.all })
  });
};

export const useDeleteVaultItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number | string) => (await api.delete(`/vault/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: vaultKeys.all })
  });
};

export const useToggleArchiveVaultItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, archived }: { id: number | string; archived?: boolean }) => {
      const params: Record<string, any> = {};
      if (archived !== undefined) params.archived = archived;
      return (await api.patch<VaultItem>(`/vault/${id}/archive`, null, { params })).data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: vaultKeys.all })
  });
};

export const usePromoteVaultItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number | string; payload?: PromoteVaultPayload }) =>
      (await api.post(`/vault/${id}/promote`, payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: vaultKeys.all });
      qc.invalidateQueries({ queryKey: taskKeys.all });
    }
  });
};

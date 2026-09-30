import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../shared/api/client';
import type { SavedFilter } from '../types';

export const filterKeys = {
  all: ['saved-filters'] as const,
};

export const useSavedFilters = () => {
  return useQuery({
    queryKey: filterKeys.all,
    queryFn: async () => {
      const { data } = await api.get('/saved-filters');
      return data as SavedFilter[];
    },
  });
};

export const useSaveFilter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<SavedFilter, 'id'>) => {
      const { data } = await api.post('/saved-filters', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: filterKeys.all });
    },
  });
};

export const useDeleteFilter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/saved-filters/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: filterKeys.all });
    },
  });
};

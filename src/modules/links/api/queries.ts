import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../shared/api/client';

export interface GlobalLink {
  id: number;
  title: string;
  url: string;
  description?: string;
}

export const useGlobalLinks = () => {
  return useQuery({
    queryKey: ['global', 'links'],
    queryFn: async () => {
      const { data } = await api.get<GlobalLink[]>('/links');
      return data;
    },
  });
};

export const useCreateGlobalLink = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (link: Partial<GlobalLink>) => {
      const { data } = await api.post('/links', link);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global', 'links'] });
    },
  });
};

export const useUpdateGlobalLink = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, link }: { id: string | number; link: Partial<GlobalLink> }) => {
      const { data } = await api.put(`/links/${id}`, link);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global', 'links'] });
    },
  });
};

export const useDeleteGlobalLink = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string | number) => {
      await api.delete(`/links/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global', 'links'] });
    },
  });
};

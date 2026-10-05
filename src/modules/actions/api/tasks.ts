import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../shared/api/client';

export interface Task {
  id: number;
  title: string;
  description?: string;
  deadline?: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export const taskKeys = {
  all: ['tasks'] as const,
  today: () => [...taskKeys.all, 'today'] as const,
  date: (date: string) => [...taskKeys.all, 'date', date] as const,
  range: (from: string, to: string) => [...taskKeys.all, 'range', from, to] as const,
  status: (status: string) => [...taskKeys.all, 'status', status] as const,
};

export const useTasksToday = () => useQuery({
  queryKey: taskKeys.today(),
  queryFn: async () => (await api.get<Task[]>('/tasks/today')).data
});

export const useTasksByDate = (date: string) => useQuery({
  queryKey: taskKeys.date(date),
  queryFn: async () => (await api.get<Task[]>(`/tasks/date/${date}`)).data
});

export const useTasksByRange = (from: string, to: string) => useQuery({
  queryKey: taskKeys.range(from, to),
  queryFn: async () => (await api.get<Task[]>('/tasks/between', { params: { from, to } })).data
});

export const useTasksByStatus = (status: 'COMPLETED' | 'CANCELLED') => useQuery({
  queryKey: taskKeys.status(status),
  queryFn: async () => (await api.get<Task[]>(`/tasks/status/${status}`)).data
});

export const useCreateTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Task>) => (await api.post('/tasks', data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all })
  });
};

export const useUpdateTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<Task> }) => (await api.put(`/tasks/${id}`, data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all })
  });
};

export const useCompleteTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => (await api.put(`/tasks/${id}/complete`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all })
  });
};

export const useCancelTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => (await api.put(`/tasks/${id}/cancel`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all })
  });
};

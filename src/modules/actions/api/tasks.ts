import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../shared/api/client';

export type TimeHorizon = 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'SOMEDAY';

export interface SubAction {
  id: number;
  taskId: number;
  title: string;
  description?: string;
  dueDate?: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  deadline?: string | null;
  timeHorizon?: TimeHorizon | string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  recurrenceGroupId?: string;
  createdAt: string;
  updatedAt: string;
  subactions?: SubAction[];
}

export const taskKeys = {
  all: ['tasks'] as const,
  detail: (id: number | string) => [...taskKeys.all, 'detail', id.toString()] as const,
  today: () => [...taskKeys.all, 'today'] as const,
  date: (date: string) => [...taskKeys.all, 'date', date] as const,
  range: (from: string, to: string) => [...taskKeys.all, 'range', from, to] as const,
  status: (status: string) => [...taskKeys.all, 'status', status] as const,
  horizon: (horizon: string) => [...taskKeys.all, 'horizon', horizon] as const,
};

export const useTasksToday = () => useQuery({
  queryKey: taskKeys.today(),
  queryFn: async () => (await api.get<Task[]>('/tasks/today')).data
});

export const useTasksByDate = (date: string) => useQuery({
  queryKey: taskKeys.date(date),
  queryFn: async () => (await api.get<Task[]>(`/tasks/date/${date}`)).data,
  enabled: !!date,
});

export const useTasksByRange = (from: string, to: string) => useQuery({
  queryKey: taskKeys.range(from, to),
  queryFn: async () => (await api.get<Task[]>('/tasks/between', { params: { from, to } })).data,
  enabled: !!from && !!to,
});

export const useTasksByStatus = (status: 'PENDING' | 'COMPLETED' | 'CANCELLED') => useQuery({
  queryKey: taskKeys.status(status),
  queryFn: async () => (await api.get<Task[]>(`/tasks/status/${status}`)).data
});

export const useTasksByHorizon = (horizon: TimeHorizon | string) => useQuery({
  queryKey: taskKeys.horizon(horizon),
  queryFn: async () => (await api.get<Task[]>(`/tasks/horizon/${horizon}`)).data,
  enabled: !!horizon,
});

export const useTaskDetail = (id: number | string) => useQuery({
  queryKey: taskKeys.detail(id),
  queryFn: async () => (await api.get<Task>(`/tasks/${id}`)).data,
  enabled: !!id,
});

export const useCreateTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Task>) => (await api.post('/tasks', data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all })
  });
};

export const useCreateRecurringTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { title: string, description?: string, daysOfWeek: string[], timeOfDay?: string }) => (await api.post('/tasks/recurring', data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all })
  });
};

export const useUpdateTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number | string, data: Partial<Task> }) => (await api.put(`/tasks/${id}`, data)).data,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
      qc.invalidateQueries({ queryKey: taskKeys.detail(vars.id) });
    }
  });
};

export const useShiftTaskHorizon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, horizon, deadline }: { id: number | string; horizon: TimeHorizon | string; deadline?: string | null }) => {
      const params: Record<string, string> = { horizon };
      if (deadline !== undefined && deadline !== null) {
        params.deadline = deadline;
      }
      return (await api.patch<Task>(`/tasks/${id}/horizon`, null, { params })).data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
      qc.invalidateQueries({ queryKey: taskKeys.detail(vars.id) });
    }
  });
};

export const useCompleteTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number | string) => (await api.put(`/tasks/${id}/complete`)).data,
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
      qc.invalidateQueries({ queryKey: taskKeys.detail(id) });
    }
  });
};

export const useCancelTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number | string) => (await api.put(`/tasks/${id}/cancel`)).data,
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
      qc.invalidateQueries({ queryKey: taskKeys.detail(id) });
    }
  });
};

export const useDeleteTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number | string) => (await api.delete(`/tasks/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all })
  });
};

// ========== Subaction Hooks ==========

export const useCreateSubAction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, data }: { taskId: number | string; data: { title: string; description?: string; dueDate?: string } }) =>
      (await api.post<SubAction>(`/tasks/${taskId}/subactions`, data)).data,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: taskKeys.detail(vars.taskId) });
      qc.invalidateQueries({ queryKey: taskKeys.all });
    }
  });
};

export const useUpdateSubActionStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId: _taskId, subId, status }: { taskId: number | string; subId: number | string; status: 'PENDING' | 'COMPLETED' | 'CANCELLED' }) =>
      (await api.patch<SubAction>(`/tasks/subactions/${subId}/status`, null, { params: { status } })).data,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: taskKeys.detail(vars.taskId) });
      qc.invalidateQueries({ queryKey: taskKeys.all });
    }
  });
};

export const useUpdateSubAction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId: _taskId, subId, data }: { taskId: number | string; subId: number | string; data: Partial<SubAction> }) =>
      (await api.put<SubAction>(`/tasks/subactions/${subId}`, data)).data,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: taskKeys.detail(vars.taskId) });
      qc.invalidateQueries({ queryKey: taskKeys.all });
    }
  });
};

export const useDeleteSubAction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId: _taskId, subId }: { taskId: number | string; subId: number | string }) =>
      (await api.delete(`/tasks/subactions/${subId}`)).data,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: taskKeys.detail(vars.taskId) });
      qc.invalidateQueries({ queryKey: taskKeys.all });
    }
  });
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../shared/api/client';
import type { Lead, FollowUp, PaginatedResponse, CategoryGroup, Stage } from '../types';

export const leadsKeys = {
  all: ['leads'] as const,
  lists: () => [...leadsKeys.all, 'list'] as const,
  list: (filters: string) => [...leadsKeys.lists(), { filters }] as const,
  details: () => [...leadsKeys.all, 'detail'] as const,
  detail: (id: string) => [...leadsKeys.details(), id] as const,
  today: () => ['today-dashboard'] as const,
  stages: () => ['stages'] as const,
  categories: () => ['categories'] as const,
};

export const useStages = () => {
  return useQuery({
    queryKey: leadsKeys.stages(),
    queryFn: async () => {
      const { data } = await api.get('/stages');
      const arrayData = Array.isArray(data) ? data : (data?.content || data?.data || []);
      return arrayData as Stage[];
    },
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: leadsKeys.categories(),
    queryFn: async () => {
      const { data } = await api.get('/categories');
      const arrayData = Array.isArray(data) ? data : (data?.content || data?.data || []);
      return arrayData as CategoryGroup[];
    },
  });
};

// MOCK APIs (replace with actual backend paths)

export const useTodayDashboard = () => {
  return useQuery({
    queryKey: leadsKeys.today(),
    queryFn: async () => {
      const { data } = await api.get('/leads/dashboard/today');
      return data as {
        dueToday: FollowUp[];
        overdue: FollowUp[];
        pendingToSend: FollowUp[];
        newThisWeek: Lead[];
      };
    },
  });
};

export const useLeadsList = (filters: any) => {
  return useQuery({
    queryKey: leadsKeys.list(JSON.stringify(filters)),
    queryFn: async () => {
      const { data } = await api.get('/leads', { params: filters });
      return data as PaginatedResponse<Lead>;
    },
  });
};

export const useLeadDetail = (id: string) => {
  return useQuery({
    queryKey: leadsKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get(`/leads/${id}`);
      return data as Lead;
    },
    enabled: !!id,
  });
};

export const useAddLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newLead: Partial<Lead>) => {
      const { data } = await api.post('/leads', newLead);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadsKeys.today() });
    },
  });
};

export const useUpdateFollowUpStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, newDate }: { id: string; status: string; newDate?: string }) => {
      const { data } = await api.patch(`/follow-ups/${id}`, { status, newDate });
      return data;
    },
    // Optimistic Update for "Today" dashboard
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: leadsKeys.today() });
      const previousData = queryClient.getQueryData(leadsKeys.today());

      if (previousData) {
        queryClient.setQueryData(leadsKeys.today(), (old: any) => {
          // Remove the followup from dueToday/overdue optimisticially
          return {
            ...old,
            dueToday: old.dueToday.filter((f: FollowUp) => f.id !== id),
            overdue: old.overdue.filter((f: FollowUp) => f.id !== id),
          };
        });
      }
      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(leadsKeys.today(), context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.today() });
    },
  });
};

export const useUpdateLeadStage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, stageId }: { id: string; stageId: string | number }) => {
      const { data } = await api.patch(`/leads/${id}/stage`, { stageId });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.lists() });
    },
  });
};
export const useUpdateLeadCategories = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, categoryIds }: { id: string; categoryIds: (string | number)[] }) => {
      const { data } = await api.put(`/leads/${id}/categories`, categoryIds);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: leadsKeys.lists() });
    },
  });
};

export const useCreateCategoryGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data } = await api.post('/categories', { name });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leadsKeys.categories() }),
  });
};

export const useUpdateCategoryGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string | number; name: string }) => {
      const { data } = await api.put(`/categories/${id}`, { name });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leadsKeys.categories() }),
  });
};

export const useDeleteCategoryGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string | number) => {
      const { data } = await api.delete(`/categories/${id}`);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leadsKeys.categories() }),
  });
};

export const useCreateCategoryValue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, name }: { groupId: string | number; name: string }) => {
      const { data } = await api.post(`/categories/${groupId}/values`, { name });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leadsKeys.categories() }),
  });
};

export const useUpdateCategoryValue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ valueId, name }: { valueId: string | number; name: string }) => {
      const { data } = await api.put(`/categories/values/${valueId}`, { name });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leadsKeys.categories() }),
  });
};

export const useDeleteCategoryValue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (valueId: string | number) => {
      const { data } = await api.delete(`/categories/values/${valueId}`);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leadsKeys.categories() }),
  });
};
import type { LeadLog } from '../types';

export const actionKeys = {
  all: ['actions'] as const,
  today: () => [...actionKeys.all, 'today'] as const,
  byDate: (date: string) => [...actionKeys.all, 'date', date] as const,
  byRange: (from: string, to: string) => [...actionKeys.all, 'range', from, to] as const,
};

export const logKeys = {
  all: ['lead-logs'] as const,
  byLead: (leadId: string) => [...logKeys.all, leadId] as const,
};

// --- LOG QUERIES & MUTATIONS ---

export const useLeadLogs = (leadId: string) => {
  return useQuery({
    queryKey: logKeys.byLead(leadId),
    queryFn: async () => {
      const { data } = await api.get(`/leads/${leadId}/logs`);
      return (Array.isArray(data) ? data : (data?.content || data?.data || [])) as LeadLog[];
    },
    enabled: !!leadId,
  });
};

export const useCreateLeadLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, log }: { leadId: string | number; log: Partial<LeadLog> }) => {
      const { data } = await api.post(`/leads/${leadId}/logs`, log);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: logKeys.byLead(variables.leadId.toString()) });
      queryClient.invalidateQueries({ queryKey: actionKeys.all });
    },
  });
};

export const useUpdateLeadLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ logId, log }: { logId: string | number; log: Partial<LeadLog> }) => {
      const { data } = await api.put(`/leads/logs/${logId}`, log);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: logKeys.all });
      queryClient.invalidateQueries({ queryKey: actionKeys.all });
    },
  });
};

export const useDeleteLeadLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (logId: string | number) => {
      const { data } = await api.delete(`/leads/logs/${logId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: logKeys.all });
      queryClient.invalidateQueries({ queryKey: actionKeys.all });
    },
  });
};

export const useCompleteLogAction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (logId: string | number) => {
      const { data } = await api.patch(`/leads/logs/${logId}/complete`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: logKeys.all });
      queryClient.invalidateQueries({ queryKey: actionKeys.all });
    },
  });
};

export const useCancelLogAction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (logId: string | number) => {
      const { data } = await api.patch(`/leads/logs/${logId}/cancel`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: logKeys.all });
      queryClient.invalidateQueries({ queryKey: actionKeys.all });
    },
  });
};

// --- ACTIONS AGENDA QUERIES ---

export const useActionsToday = () => {
  return useQuery({
    queryKey: actionKeys.today(),
    queryFn: async () => {
      const { data } = await api.get('/actions/today');
      return (Array.isArray(data) ? data : (data?.content || data?.data || [])) as LeadLog[];
    },
  });
};

export const useActionsByDate = (date: string) => {
  return useQuery({
    queryKey: actionKeys.byDate(date),
    queryFn: async () => {
      const { data } = await api.get(`/actions?date=${date}`);
      return (Array.isArray(data) ? data : (data?.content || data?.data || [])) as LeadLog[];
    },
    enabled: !!date,
  });
};

export const useActionsByRange = (from: string, to: string) => {
  return useQuery({
    queryKey: actionKeys.byRange(from, to),
    queryFn: async () => {
      const { data } = await api.get(`/actions/range?from=${from}&to=${to}`);
      return (Array.isArray(data) ? data : (data?.content || data?.data || [])) as LeadLog[];
    },
    enabled: !!from && !!to,
  });
};

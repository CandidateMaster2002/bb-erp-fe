import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../shared/api/client';
import type { FollowUp } from '../types';

export const reminderKeys = {
  all: ['reminders'] as const,
  summary: () => [...reminderKeys.all, 'summary'] as const,
  dueNow: () => [...reminderKeys.all, 'due-now'] as const,
};

export const useReminderSummary = () => {
  return useQuery({
    queryKey: reminderKeys.summary(),
    queryFn: async () => {
      const { data } = await api.get('/reminders/summary');
      return data as { dueToday: FollowUp[]; overdue: FollowUp[]; count: number };
    },
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });
};

export const useDueNow = () => {
  return useQuery({
    queryKey: reminderKeys.dueNow(),
    queryFn: async () => {
      const { data } = await api.get('/reminders/due-now');
      return data as FollowUp[];
    },
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });
};

export const useAcknowledgeFollowUp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/followups/${id}/acknowledge`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reminderKeys.all });
    },
  });
};

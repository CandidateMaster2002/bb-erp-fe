import { useQuery } from '@tanstack/react-query';
import api from '../../../shared/api/client';

export const reportKeys = {
  all: ['reports'] as const,
  dateRange: (range: string) => [...reportKeys.all, { range }] as const,
};

export const useReports = (dateRange: string) => {
  return useQuery({
    queryKey: reportKeys.dateRange(dateRange),
    queryFn: async () => {
      const { data } = await api.get('/reports/summary', { params: { dateRange } });
      return data; // contains cards and charts data
    },
  });
};

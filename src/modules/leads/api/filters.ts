import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../shared/api/client';
import type { SavedFilter } from '../types';

export const filterKeys = {
  all: ['saved-filters'] as const,
};

const getLocalSavedFilters = (): SavedFilter[] => {
  try {
    const raw = localStorage.getItem('erp_saved_filters');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const setLocalSavedFilters = (filters: SavedFilter[]) => {
  try {
    localStorage.setItem('erp_saved_filters', JSON.stringify(filters));
    window.dispatchEvent(new Event('saved_filters_updated'));
  } catch {
    // Ignore storage errors
  }
};

export const useSavedFilters = () => {
  return useQuery({
    queryKey: filterKeys.all,
    initialData: getLocalSavedFilters,
    queryFn: async () => {
      try {
        const { data } = await api.get('/saved-filters');
        if (Array.isArray(data)) {
          const parsed = data.map((item: any) => {
            let filters = item.filters;
            if (!filters && item.filterJson) {
              try {
                filters = JSON.parse(item.filterJson);
              } catch {
                filters = {};
              }
            }
            return {
              id: item.id,
              name: item.name,
              filterJson: item.filterJson,
              filters: filters || {},
              createdAt: item.createdAt,
            } as SavedFilter;
          });
          setLocalSavedFilters(parsed);
          return parsed;
        }
      } catch (err) {
        console.warn('Backend saved-filters fetch failed, using local cache:', err);
      }
      return getLocalSavedFilters();
    },
  });
};

export const useSaveFilter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; filters?: any; filterJson?: string }) => {
      const filterJson = payload.filterJson || JSON.stringify(payload.filters || {});
      const reqPayload = {
        name: payload.name,
        filterJson,
      };

      try {
        const { data } = await api.post('/saved-filters', reqPayload);
        const newFilter: SavedFilter = {
          id: data.id,
          name: data.name,
          filterJson: data.filterJson,
          filters: payload.filters || (data.filterJson ? JSON.parse(data.filterJson) : {}),
          createdAt: data.createdAt || new Date().toISOString(),
        };

        const currentLocal = getLocalSavedFilters().filter(f => f.id !== newFilter.id);
        setLocalSavedFilters([newFilter, ...currentLocal]);
        return newFilter;
      } catch (err) {
        console.warn('Backend save filter failed, saving locally:', err);
        const fallbackFilter: SavedFilter = {
          id: `local_${Date.now()}`,
          name: payload.name,
          filterJson,
          filters: payload.filters || {},
          createdAt: new Date().toISOString(),
        };
        const currentLocal = getLocalSavedFilters();
        setLocalSavedFilters([fallbackFilter, ...currentLocal]);
        return fallbackFilter;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: filterKeys.all });
    },
  });
};

export const useDeleteFilter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string | number) => {
      try {
        if (!String(id).startsWith('local_')) {
          await api.delete(`/saved-filters/${id}`);
        }
      } catch (err) {
        console.warn('Backend delete filter failed, removing locally:', err);
      }
      const updated = getLocalSavedFilters().filter(f => String(f.id) !== String(id));
      setLocalSavedFilters(updated);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: filterKeys.all });
    },
  });
};

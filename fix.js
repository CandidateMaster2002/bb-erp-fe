const fs = require('fs');
let content = fs.readFileSync('src/modules/leads/api/queries.ts', 'utf8');
content = content.substring(0, content.indexOf('export const useCreateCategoryGroup'));
content += \export const useCreateCategoryGroup = () => {
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
      const { data } = await api.put(\\\/categories/\\\\, { name });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leadsKeys.categories() }),
  });
};

export const useDeleteCategoryGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string | number) => {
      const { data } = await api.delete(\\\/categories/\\\\);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leadsKeys.categories() }),
  });
};

export const useCreateCategoryValue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, name }: { groupId: string | number; name: string }) => {
      const { data } = await api.post(\\\/categories/\/values\\\, { name });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leadsKeys.categories() }),
  });
};

export const useUpdateCategoryValue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ valueId, name }: { valueId: string | number; name: string }) => {
      const { data } = await api.put(\\\/categories/values/\\\\, { name });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leadsKeys.categories() }),
  });
};

export const useDeleteCategoryValue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (valueId: string | number) => {
      const { data } = await api.delete(\\\/categories/values/\\\\);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leadsKeys.categories() }),
  });
};
\;
fs.writeFileSync('src/modules/leads/api/queries.ts', content);

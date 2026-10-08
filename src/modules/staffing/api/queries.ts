import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../shared/api/client';
import type { Client, Vendor, Requirement } from '../types';

export const staffingKeys = {
  clients: ['staffing-clients'] as const,
  vendors: ['staffing-vendors'] as const,
  requirements: ['staffing-requirements'] as const,
  requirement: (id: string) => ['staffing-requirements', id] as const,
};

// Clients
export const useClients = () => {
  return useQuery({
    queryKey: staffingKeys.clients,
    queryFn: async () => (await api.get<Client[]>('/staffing/clients')).data,
  });
};

export const useCreateClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string }) => (await api.post('/staffing/clients', data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: staffingKeys.clients }),
  });
};

export const useUpdateClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { name: string } }) => (await api.put(`/staffing/clients/${id}`, data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: staffingKeys.clients }),
  });
};

export const useDeleteClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => await api.delete(`/staffing/clients/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: staffingKeys.clients }),
  });
};

// Vendors
export const useVendors = () => {
  return useQuery({
    queryKey: staffingKeys.vendors,
    queryFn: async () => (await api.get<Vendor[]>('/staffing/vendors')).data,
  });
};

export const useCreateVendor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string }) => (await api.post('/staffing/vendors', data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: staffingKeys.vendors }),
  });
};

export const useUpdateVendor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { name: string } }) => (await api.put(`/staffing/vendors/${id}`, data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: staffingKeys.vendors }),
  });
};

export const useDeleteVendor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => await api.delete(`/staffing/vendors/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: staffingKeys.vendors }),
  });
};

// Requirements
export const useRequirements = () => {
  return useQuery({
    queryKey: staffingKeys.requirements,
    queryFn: async () => (await api.get<Requirement[]>('/staffing/requirements')).data,
  });
};

export const useRequirementDetail = (id: string) => {
  return useQuery({
    queryKey: staffingKeys.requirement(id),
    queryFn: async () => (await api.get<Requirement>(`/staffing/requirements/${id}`)).data,
    enabled: !!id,
  });
};

export const useCreateRequirement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Requirement>) => (await api.post('/staffing/requirements', data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: staffingKeys.requirements }),
  });
};

export const useUpdateRequirement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Requirement> }) => (await api.put(`/staffing/requirements/${id}`, data)).data,
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: staffingKeys.requirements });
      qc.invalidateQueries({ queryKey: staffingKeys.requirement(variables.id.toString()) });
    },
  });
};

export const useDeleteRequirement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => await api.delete(`/staffing/requirements/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: staffingKeys.requirements }),
  });
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../shared/api/client';
import type { InvoiceData } from '../types';

export function useInvoices() {
  return useQuery<InvoiceData[]>({
    queryKey: ['invoices'],
    queryFn: async () => {
      const response = await api.get('/invoices');
      return (response.data || []).map((inv: any) => {
        let parsedItems = [];
        try {
          parsedItems = inv.itemsJson ? JSON.parse(inv.itemsJson) : [];
        } catch (e) {
          console.error('Failed to parse itemsJson for invoice', inv.id, e);
        }
        return {
          ...inv,
          items: parsedItems,
        };
      });
    },
  });
}

export function useInvoice(id?: number) {
  return useQuery<InvoiceData>({
    queryKey: ['invoices', id],
    queryFn: async () => {
      if (!id) throw new Error('Invoice id is required');
      const response = await api.get(`/invoices/${id}`);
      const inv = response.data;
      let parsedItems = [];
      try {
        parsedItems = inv.itemsJson ? JSON.parse(inv.itemsJson) : [];
      } catch (e) {
        console.error('Failed to parse itemsJson for invoice', id, e);
      }
      return {
        ...inv,
        items: parsedItems,
      };
    },
    enabled: !!id,
  });
}

export function useSaveInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoice: InvoiceData) => {
      const payload = {
        ...invoice,
        itemsJson: JSON.stringify(invoice.items || []),
      };

      if (invoice.id) {
        const res = await api.put(`/invoices/${invoice.id}`, payload);
        return res.data;
      } else {
        const res = await api.post('/invoices', payload);
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/invoices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

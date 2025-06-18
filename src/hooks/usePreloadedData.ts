
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Hook customizado que usa dados do cache quando disponível
export const usePreloadedProducts = () => {
  return useQuery({
    queryKey: ['produtos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

export const usePreloadedClients = () => {
  return useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const usePreloadedBudgets = () => {
  return useQuery({
    queryKey: ['orcamentos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orcamentos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const usePreloadedInvoices = () => {
  return useQuery({
    queryKey: ['faturas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faturas')
        .select('*');
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const usePreloadedExpenses = () => {
  return useQuery({
    queryKey: ['despesas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('despesas')
        .select('*');
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const usePreloadedAgenda = () => {
  return useQuery({
    queryKey: ['agenda'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agenda')
        .select('*')
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

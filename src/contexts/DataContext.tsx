
import React, { createContext, useContext, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DataContextType {
  isPreloading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useDataContext = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();

  // Pré-carrega todos os dados essenciais
  const { isLoading: isPreloading } = useQuery({
    queryKey: ['preload-data'],
    queryFn: async () => {
      console.log('Pré-carregando dados...');
      
      // Carrega todos os dados em paralelo
      const [
        produtosData,
        clientesData,
        orcamentosData,
        faturasData,
        despesasData,
        agendaData
      ] = await Promise.all([
        // Produtos
        supabase.from('produtos').select('*').order('created_at', { ascending: false }),
        // Clientes
        supabase.from('clientes').select('*').order('created_at', { ascending: false }),
        // Orçamentos
        supabase.from('orcamentos').select('*').order('created_at', { ascending: false }),
        // Faturas
        supabase.from('faturas').select('*'),
        // Despesas
        supabase.from('despesas').select('*'),
        // Agenda
        supabase.from('agenda').select('*').order('start_time', { ascending: true })
      ]);

      // Verifica se houve erros
      if (produtosData.error) throw produtosData.error;
      if (clientesData.error) throw clientesData.error;
      if (orcamentosData.error) throw orcamentosData.error;
      if (faturasData.error) throw faturasData.error;
      if (despesasData.error) throw despesasData.error;
      if (agendaData.error) throw agendaData.error;

      // Popula o cache do React Query com os dados carregados
      queryClient.setQueryData(['produtos'], produtosData.data);
      queryClient.setQueryData(['clientes'], clientesData.data);
      queryClient.setQueryData(['orcamentos'], orcamentosData.data);
      queryClient.setQueryData(['faturas'], faturasData.data);
      queryClient.setQueryData(['despesas'], despesasData.data);
      queryClient.setQueryData(['agenda'], agendaData.data);

      console.log('Dados pré-carregados com sucesso!');
      
      return {
        produtos: produtosData.data,
        clientes: clientesData.data,
        orcamentos: orcamentosData.data,
        faturas: faturasData.data,
        despesas: despesasData.data,
        agenda: agendaData.data
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });

  const value = {
    isPreloading
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

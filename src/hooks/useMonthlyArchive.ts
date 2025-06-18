
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useMonthlyArchive = () => {
  useEffect(() => {
    const checkAndArchiveMonth = async () => {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const currentDay = now.getDate();
      
      // Só executa no dia 1 do mês
      if (currentDay !== 1) return;
      
      // Calcular mês anterior
      let previousMonth = currentMonth - 1;
      let previousYear = currentYear;
      
      if (previousMonth === 0) {
        previousMonth = 12;
        previousYear = currentYear - 1;
      }
      
      try {
        // Verificar se já existe relatório arquivado para o mês anterior
        const { data: existingReport } = await supabase
          .from('relatorios_mensais')
          .select('id')
          .eq('mes', previousMonth)
          .eq('ano', previousYear)
          .single();
        
        if (existingReport) {
          console.log('Relatório do mês anterior já existe');
          return;
        }
        
        // Buscar despesas do mês anterior
        const startOfPreviousMonth = new Date(previousYear, previousMonth - 1, 1);
        const endOfPreviousMonth = new Date(previousYear, previousMonth, 0);
        
        const { data: expenses } = await supabase
          .from('despesas')
          .select('*')
          .gte('date', startOfPreviousMonth.toISOString().split('T')[0])
          .lte('date', endOfPreviousMonth.toISOString().split('T')[0]);
        
        // Buscar faturas do mês anterior
        const { data: revenues } = await supabase
          .from('faturas')
          .select('*')
          .gte('date', startOfPreviousMonth.toISOString().split('T')[0])
          .lte('date', endOfPreviousMonth.toISOString().split('T')[0]);
        
        // Calcular totais
        const totalExpenses = expenses?.reduce((total, expense) => {
          return total + parseFloat(expense.value?.toString() || '0');
        }, 0) || 0;
        
        const totalRevenues = revenues?.reduce((total, revenue) => {
          return total + parseFloat(revenue.value?.toString() || '0');
        }, 0) || 0;
        
        const netProfit = totalRevenues - totalExpenses;
        
        // Arquivar o relatório
        const { error } = await supabase
          .from('relatorios_mensais')
          .insert({
            mes: previousMonth,
            ano: previousYear,
            total_receitas: totalRevenues,
            total_despesas: totalExpenses,
            lucro_liquido: netProfit,
            despesas: expenses || [],
            faturas: revenues || []
          });
        
        if (error) {
          console.error('Erro ao arquivar relatório mensal:', error);
        } else {
          console.log(`Relatório de ${previousMonth}/${previousYear} arquivado com sucesso`);
        }
        
      } catch (error) {
        console.error('Erro no processo de arquivamento:', error);
      }
    };
    
    // Executar verificação quando o componente monta
    checkAndArchiveMonth();
    
    // Configurar verificação diária (opcional, para teste em desenvolvimento)
    const interval = setInterval(checkAndArchiveMonth, 24 * 60 * 60 * 1000); // 24 horas
    
    return () => clearInterval(interval);
  }, []);
};

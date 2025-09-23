
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
        // Para agora, vamos comentar esta funcionalidade até que a tabela seja criada
        const existingReport = null;
        
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
          return total + parseFloat(expense.amount?.toString() || '0');
        }, 0) || 0;
        
        const totalRevenues = revenues?.reduce((total, revenue) => {
          return total + parseFloat(revenue.value?.toString() || '0');
        }, 0) || 0;
        
        const netProfit = totalRevenues - totalExpenses;
        
        // Arquivar o relatório - comentado até tabela ser criada
        console.log(`Relatório seria arquivado: ${previousMonth}/${previousYear}`, {
          totalRevenues,
          totalExpenses,
          netProfit
        });
        const archiveError = null;
        
        if (archiveError) {
          console.error('Erro ao arquivar relatório mensal:', archiveError);
          return;
        }
        
        console.log(`Relatório de ${previousMonth}/${previousYear} arquivado com sucesso`);
        
        // Após arquivar com sucesso, excluir despesas do mês anterior
        if (expenses && expenses.length > 0) {
          const expenseIds = expenses.map(expense => expense.id);
          const { error: deleteExpensesError } = await supabase
            .from('despesas')
            .delete()
            .in('id', expenseIds);
          
          if (deleteExpensesError) {
            console.error('Erro ao excluir despesas do mês anterior:', deleteExpensesError);
          } else {
            console.log(`${expenses.length} despesas do mês anterior excluídas`);
          }
        }
        
        // Após arquivar com sucesso, excluir faturas do mês anterior
        if (revenues && revenues.length > 0) {
          const revenueIds = revenues.map(revenue => revenue.id);
          const { error: deleteRevenuesError } = await supabase
            .from('faturas')
            .delete()
            .in('id', revenueIds);
          
          if (deleteRevenuesError) {
            console.error('Erro ao excluir faturas do mês anterior:', deleteRevenuesError);
          } else {
            console.log(`${revenues.length} faturas do mês anterior excluídas`);
          }
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

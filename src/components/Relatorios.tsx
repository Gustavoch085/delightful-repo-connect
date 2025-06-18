import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, DollarSign, Edit, Trash2, Plus, User, Calendar } from "lucide-react";
import { DespesaModal } from "./modals/DespesaModal";
import { FaturaModal } from "./modals/FaturaModal";
import { RelatorioMensalModal } from "./modals/RelatorioMensalModal";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useMonthlyArchive } from "@/hooks/useMonthlyArchive";

export function Relatorios() {
  const [despesaModalOpen, setDespesaModalOpen] = useState(false);
  const [faturaModalOpen, setFaturaModalOpen] = useState(false);
  const [relatorioMensalModalOpen, setRelatorioMensalModalOpen] = useState(false);
  const [editingDespesa, setEditingDespesa] = useState(null);
  const [editingFatura, setEditingFatura] = useState(null);
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [previousMonthReport, setPreviousMonthReport] = useState(null);

  // Hook for monthly archiving
  useMonthlyArchive();

  // Pega o mês/ano atual para filtrar
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-based
  const currentYear = currentDate.getFullYear();

  // Calcular mês anterior
  let previousMonth = currentMonth - 1;
  let previousYear = currentYear;
  
  if (previousMonth === 0) {
    previousMonth = 12;
    previousYear = currentYear - 1;
  }

  const getMonthName = (month: number) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1];
  };

  // Buscar relatório do mês anterior
  const { data: previousReport } = useQuery({
    queryKey: ['relatorio-mensal', previousMonth, previousYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('relatorios_mensais')
        .select('*')
        .eq('mes', previousMonth)
        .eq('ano', previousYear)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }
      return data;
    }
  });

  // Buscar despesas do Supabase
  const { data: expenses = [], refetch: refetchExpenses } = useQuery({
    queryKey: ['despesas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('despesas')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Buscar faturas do Supabase
  const { data: revenues = [], refetch: refetchRevenues } = useQuery({
    queryKey: ['faturas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faturas')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Buscar orçamentos com status "Venda Gerada" para converter para faturas
  const { data: budgets = [], refetch: refetchBudgets } = useQuery({
    queryKey: ['orcamentos-vendas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orcamentos')
        .select(`
          *,
          orcamento_items (
            id,
            product_name,
            quantity,
            price,
            subtotal
          )
        `)
        .eq('status', 'Venda Gerada');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Converter orçamentos com "Venda Gerada" em faturas automaticamente
  useEffect(() => {
    const convertSalesToInvoices = async () => {
      if (budgets.length > 0) {
        for (const budget of budgets) {
          // Verificar se já existe uma fatura para este orçamento
          const { data: existingInvoice } = await supabase
            .from('faturas')
            .select('id')
            .eq('orcamento_id', budget.id)
            .single();

          if (!existingInvoice) {
            // Criar nova fatura baseada no orçamento
            const { error } = await supabase
              .from('faturas')
              .insert({
                title: budget.title,
                client_name: budget.client_name,
                value: budget.total,
                date: budget.date,
                orcamento_id: budget.id,
                status: 'Pago'
              });

            if (error) {
              console.error('Erro ao converter venda para fatura:', error);
            }
          }
        }
        // Atualizar faturas após conversão
        refetchRevenues();
      }
    };

    convertSalesToInvoices();
  }, [budgets, refetchRevenues]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const isCurrentMonth = (dateString: string) => {
    const date = new Date(dateString);
    return date.getMonth() + 1 === currentMonth && date.getFullYear() === currentYear;
  };

  const calculateTotal = (items: any[], filterByMonth: boolean = true) => {
    const filteredItems = filterByMonth 
      ? items.filter(item => isCurrentMonth(item.date))
      : items;
    
    return filteredItems.reduce((total, item) => {
      const value = parseFloat(item.value?.toString() || '0');
      return total + Math.abs(value);
    }, 0);
  };

  // Agrupar despesas por cliente
  const expensesByClient = expenses.reduce((groups, expense) => {
    const clientName = expense.category || 'Sem Cliente';
    if (!groups[clientName]) {
      groups[clientName] = [];
    }
    groups[clientName].push(expense);
    return groups;
  }, {} as Record<string, any[]>);

  // Filtrar despesas por cliente selecionado
  const filteredExpenses = selectedClient === "all" 
    ? expenses 
    : expenses.filter(expense => (expense.category || 'Sem Cliente') === selectedClient);

  // Obter lista única de clientes das despesas
  const clientsFromExpenses = Array.from(new Set(
    expenses.map(expense => expense.category || 'Sem Cliente')
  )).sort();

  const totalExpenses = calculateTotal(expenses, true); // Filtra pelo mês atual
  const totalRevenues = calculateTotal(revenues, true); // Filtra pelo mês atual
  const netProfit = totalRevenues - totalExpenses;

  const financialStats = [
    {
      title: "Total Receitas",
      value: formatCurrency(totalRevenues),
      icon: TrendingUp,
      iconBg: "bg-green-600",
      color: "text-green-400"
    },
    {
      title: "Total Despesas",
      value: formatCurrency(totalExpenses),
      icon: TrendingDown,
      iconBg: "bg-red-600",
      color: "text-red-400"
    },
    {
      title: "Lucro Líquido",
      value: formatCurrency(netProfit),
      icon: DollarSign,
      iconBg: netProfit >= 0 ? "bg-green-600" : "bg-red-600",
      color: netProfit >= 0 ? "text-green-400" : "text-red-400"
    },
  ];

  const handleSaveDespesa = async (despesaData: any) => {
    if (editingDespesa) {
      const { error } = await supabase
        .from('despesas')
        .update({
          title: despesaData.title,
          category: despesaData.client, // Usando client como category
          value: parseFloat(despesaData.value.replace('- R$ ', '').replace('.', '').replace(',', '.')),
          date: despesaData.date
        })
        .eq('id', editingDespesa.id);
      
      if (error) {
        console.error('Erro ao atualizar despesa:', error);
        return;
      }
      setEditingDespesa(null);
    } else {
      const { error } = await supabase
        .from('despesas')
        .insert({
          title: despesaData.title,
          category: despesaData.client,
          value: parseFloat(despesaData.value.replace('- R$ ', '').replace('.', '').replace(',', '.')),
          date: despesaData.date
        });
      
      if (error) {
        console.error('Erro ao criar despesa:', error);
        return;
      }
    }
    refetchExpenses();
  };

  const handleSaveFatura = async (faturaData: any) => {
    if (editingFatura) {
      const { error } = await supabase
        .from('faturas')
        .update({
          title: faturaData.title,
          client_name: faturaData.client,
          value: parseFloat(faturaData.value.replace('+ R$ ', '').replace('.', '').replace(',', '.')),
          date: faturaData.date
        })
        .eq('id', editingFatura.id);
      
      if (error) {
        console.error('Erro ao atualizar fatura:', error);
        return;
      }
      setEditingFatura(null);
    } else {
      const { error } = await supabase
        .from('faturas')
        .insert({
          title: faturaData.title,
          client_name: faturaData.client,
          value: parseFloat(faturaData.value.replace('+ R$ ', '').replace('.', '').replace(',', '.')),
          date: faturaData.date
        });
      
      if (error) {
        console.error('Erro ao criar fatura:', error);
        return;
      }
    }
    refetchRevenues();
  };

  const handleDeleteExpense = async (id: string) => {
    const { error } = await supabase
      .from('despesas')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao deletar despesa:', error);
      return;
    }
    refetchExpenses();
  };

  const handleDeleteRevenue = async (id: string) => {
    const { error } = await supabase
      .from('faturas')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao deletar fatura:', error);
      return;
    }
    refetchRevenues();
  };

  const handleShowPreviousMonthReport = () => {
    setPreviousMonthReport(previousReport);
    setRelatorioMensalModalOpen(true);
  };

  return (
    <div className="p-6 bg-crm-dark min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Relatórios Financeiros</h1>
        
        {/* Botão do relatório do mês anterior - sempre visível */}
        <Button
          onClick={handleShowPreviousMonthReport}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Relatório de {getMonthName(previousMonth)} {previousYear}
        </Button>
      </div>
      
      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {financialStats.map((stat) => (
          <Card key={stat.title} className="bg-crm-card border-crm-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{stat.title}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
                <div className={`w-12 h-12 ${stat.iconBg} rounded-lg flex items-center justify-center`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs for Expenses and Revenues */}
      <Card className="bg-crm-card border-crm-border">
        <CardContent className="p-6">
          <Tabs defaultValue="expenses" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-crm-dark">
              <TabsTrigger value="expenses" className="text-gray-300 data-[state=active]:text-white">
                Despesas
              </TabsTrigger>
              <TabsTrigger value="revenues" className="text-gray-300 data-[state=active]:text-white">
                Faturas
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="expenses" className="mt-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-semibold text-white">Despesas</h3>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <Select value={selectedClient} onValueChange={setSelectedClient}>
                      <SelectTrigger className="w-48 bg-crm-dark border-crm-border text-white">
                        <SelectValue placeholder="Selecionar cliente" />
                      </SelectTrigger>
                      <SelectContent className="bg-crm-dark border-crm-border">
                        <SelectItem value="all" className="text-white">Todos os Clientes</SelectItem>
                        {clientsFromExpenses.map((clientName) => (
                          <SelectItem key={clientName} value={clientName} className="text-white">
                            {clientName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button 
                  onClick={() => {
                    setEditingDespesa(null);
                    setDespesaModalOpen(true);
                  }}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Despesa
                </Button>
              </div>

              {filteredExpenses.length > 0 ? (
                <div className="space-y-4">
                  {filteredExpenses.map((expense) => (
                    <div key={expense.id} className="flex justify-between items-center p-4 rounded-lg border border-crm-border">
                      <div>
                        <p className="text-white font-medium">{expense.title}</p>
                        <p className="text-gray-400 text-sm">
                          {expense.category || 'Sem Cliente'} • {new Date(expense.date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-red-400 font-semibold">- {formatCurrency(parseFloat(expense.value?.toString() || '0'))}</p>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => {
                              setEditingDespesa({
                                ...expense,
                                client: expense.category,
                                value: `- R$ ${parseFloat(expense.value?.toString() || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                              });
                              setDespesaModalOpen(true);
                            }}
                            className="text-gray-400 hover:text-white"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="text-gray-400 hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">
                    {selectedClient === "all" 
                      ? "Nenhuma despesa registrada ainda." 
                      : `Nenhuma despesa encontrada para ${selectedClient}.`
                    }
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="revenues" className="mt-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-white">Faturas</h3>
                <Button 
                  onClick={() => {
                    setEditingFatura(null);
                    setFaturaModalOpen(true);
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Fatura
                </Button>
              </div>
              
              <div className="space-y-4">
                {revenues.map((revenue) => (
                  <div key={revenue.id} className="flex justify-between items-center p-4 rounded-lg border border-crm-border">
                    <div>
                      <p className="text-white font-medium">{revenue.title}</p>
                      <p className="text-gray-400 text-sm">
                        {revenue.client_name} • {new Date(revenue.date).toLocaleDateString('pt-BR')}
                        {revenue.orcamento_id && <span className="ml-2 text-purple-400">(Venda Gerada)</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-green-400 font-semibold">+ {formatCurrency(parseFloat(revenue.value?.toString() || '0'))}</p>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => {
                            setEditingFatura({
                              ...revenue,
                              client: revenue.client_name,
                              value: `+ R$ ${parseFloat(revenue.value?.toString() || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            });
                            setFaturaModalOpen(true);
                          }}
                          className="text-gray-400 hover:text-white"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleDeleteRevenue(revenue.id)}
                          className="text-gray-400 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <DespesaModal
        open={despesaModalOpen}  
        onOpenChange={setDespesaModalOpen}
        despesa={editingDespesa}
        onSave={handleSaveDespesa}
      />

      <FaturaModal
        open={faturaModalOpen}
        onOpenChange={setFaturaModalOpen}
        fatura={editingFatura}
        onSave={handleSaveFatura}
      />

      <RelatorioMensalModal
        open={relatorioMensalModalOpen}
        onOpenChange={setRelatorioMensalModalOpen}
        relatorio={previousMonthReport}
      />
    </div>
  );
}

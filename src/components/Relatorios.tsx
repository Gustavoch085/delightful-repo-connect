
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, DollarSign, Edit, Trash2, Plus } from "lucide-react";
import { DespesaModal } from "./modals/DespesaModal";
import { FaturaModal } from "./modals/FaturaModal";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export function Relatorios() {
  const [despesaModalOpen, setDespesaModalOpen] = useState(false);
  const [faturaModalOpen, setFaturaModalOpen] = useState(false);
  const [editingDespesa, setEditingDespesa] = useState(null);
  const [editingFatura, setEditingFatura] = useState(null);

  // Pega o mês/ano atual para filtrar
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-based
  const currentYear = currentDate.getFullYear();

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

  return (
    <div className="p-6 bg-crm-dark min-h-screen">
      <h1 className="text-3xl font-bold text-white mb-8">Relatórios Financeiros</h1>
      
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
                <h3 className="text-xl font-semibold text-white">Despesas</h3>
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
              
              <div className="space-y-4">
                {expenses.map((expense) => (
                  <div key={expense.id} className="flex justify-between items-center p-4 rounded-lg border border-crm-border">
                    <div>
                      <p className="text-white font-medium">{expense.title}</p>
                      <p className="text-gray-400 text-sm">{expense.category || 'Sem categoria'} • {new Date(expense.date).toLocaleDateString('pt-BR')}</p>
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
                      <p className="text-gray-400 text-sm">{revenue.client_name} • {new Date(revenue.date).toLocaleDateString('pt-BR')}</p>
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
    </div>
  );
}

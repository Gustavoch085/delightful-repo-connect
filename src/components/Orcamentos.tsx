import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit, RefreshCw, ShoppingCart } from "lucide-react";
import { OrcamentoModal } from "./modals/OrcamentoModal";
import { PDFGenerator } from "./PDFGenerator";
import { useLogs } from "@/contexts/LogsContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Type definitions for better TypeScript support
interface BudgetData {
  id?: string;
  title?: string;
  client: string;
  deliveryDate: string;
  status?: string;
  items: Array<{
    product_name?: string;
    name?: string;
    product?: string;
    quantity: number;
    price: string | number;
  }>;
}

interface UpdateStatusData {
  id: string;
  status: string;
}

export function Orcamentos() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { addLog } = useLogs();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Função para converter data brasileira (dd/mm/yyyy) para formato ISO (yyyy-mm-dd)
  const convertBrazilianDateToISO = (brazilianDate: string) => {
    if (!brazilianDate) return null;
    
    // Se já está no formato ISO (yyyy-mm-dd), retorna como está
    if (brazilianDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return brazilianDate;
    }
    
    // Se está no formato brasileiro (dd/mm/yyyy), converte
    if (brazilianDate.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
      const [day, month, year] = brazilianDate.split('/');
      const formattedDay = day.padStart(2, '0');
      const formattedMonth = month.padStart(2, '0');
      return `${year}-${formattedMonth}-${formattedDay}`;
    }
    
    return null;
  };

  // Função para formatar data ISO (yyyy-mm-dd) para formato brasileiro (dd/mm/yyyy)
  const formatDateToBrazilian = (isoDate: string) => {
    if (!isoDate) return '';
    // Não adicionar horário para evitar problemas de timezone
    const dateParts = isoDate.split('-');
    return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
  };

  // Query para buscar orçamentos
  const { data: budgets = [], isLoading, refetch } = useQuery({
    queryKey: ['orcamentos'],
    queryFn: async () => {
      console.log('Executando query de orçamentos...');
      const { data, error } = await supabase
        .from('orcamentos')
        .select(`
          *,
          orcamento_items (
            id,
            product_name,
            price,
            quantity,
            subtotal
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar orçamentos:', error);
        throw error;
      }
      
      console.log('Orçamentos carregados:', data);
      return data;
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: 3,
  });

  // Fetch clients for the modal - buscar todos os campos necessários
  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, name, address, cidade, phone, email')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch products for the modal
  const { data: produtos = [] } = useQuery({
    queryKey: ['produtos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select('id, name, price')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Função para refetch com loading state
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast({
        title: "Lista atualizada",
        description: "Os orçamentos foram atualizados com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar a lista de orçamentos.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Create budget mutation
  const createBudgetMutation = useMutation({
    mutationFn: async (budgetData: BudgetData) => {
      console.log('Criando novo orçamento:', budgetData);
      
      const { items, ...orcamentoData } = budgetData;
      
      // Calculate total from items
      const totalValue = items.reduce((total, item) => {
        const itemPrice = typeof item.price === 'string' 
          ? parseFloat(item.price.replace(',', '.'))
          : item.price;
        return total + (item.quantity * itemPrice);
      }, 0);

      // Prepare orçamento data - usar delivery_date em vez de date
      const dataToInsert = {
        title: orcamentoData.title || `Orçamento #${Date.now()}`,
        client_name: orcamentoData.client,
        delivery_date: convertBrazilianDateToISO(orcamentoData.deliveryDate),
        total: totalValue,
        status: orcamentoData.status || 'Aguardando'
      };

      console.log('Dados a inserir:', dataToInsert);
      
      // First create the budget
      const { data: orcamento, error: orcamentoError } = await supabase
        .from('orcamentos')
        .insert([dataToInsert])
        .select()
        .single();
      
      if (orcamentoError) {
        console.error('Erro ao criar orçamento:', orcamentoError);
        throw orcamentoError;
      }
      
      console.log('Orçamento criado:', orcamento);
      
      // Then create the items
      if (items && items.length > 0) {
        const itemsData = items.map((item) => {
          const itemPrice = typeof item.price === 'string' 
            ? parseFloat(item.price.replace(',', '.'))
            : item.price;
          
          return {
            orcamento_id: orcamento.id,
            product_name: item.product_name ?? item.name ?? item.product,
            price: itemPrice,
            quantity: item.quantity
          };
        });
        
        console.log('Itens a inserir:', itemsData);
        
        const { error: itemsError } = await supabase
          .from('orcamento_items')
          .insert(itemsData);
        
        if (itemsError) {
          console.error('Erro ao criar itens:', itemsError);
          throw itemsError;
        }
        
        console.log('Itens criados com sucesso');
      }
      
      return orcamento;
    },
    onSuccess: async (data) => {
      console.log('Orçamento criado com sucesso!');
      
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
      await refetch();
      
      addLog('create', 'orcamento', data.title, `Cliente: ${data.client_name} - Total: R$ ${data.total}`);
      setModalOpen(false);
      setEditingBudget(null);
      
      toast({
        title: "Orçamento criado",
        description: `Orçamento para ${data.client_name} foi criado com sucesso.`,
      });
    },
    onError: (error) => {
      console.error('Erro ao criar orçamento:', error);
      toast({
        title: "Erro ao criar orçamento",
        description: "Não foi possível criar o orçamento. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Update budget mutation
  const updateBudgetMutation = useMutation({
    mutationFn: async (budgetData: BudgetData & { id: string }) => {
      const { items, id, ...orcamentoData } = budgetData;
      
      // Calculate total from items
      const totalValue = items.reduce((total, item) => {
        const itemPrice = typeof item.price === 'string' 
          ? parseFloat(item.price.replace(',', '.'))
          : item.price;
        return total + (item.quantity * itemPrice);
      }, 0);

      // Update the budget - usar delivery_date
      const { data: orcamento, error: orcamentoError } = await supabase
        .from('orcamentos')
        .update({
          client_name: orcamentoData.client,
          delivery_date: convertBrazilianDateToISO(orcamentoData.deliveryDate),
          total: totalValue,
          status: orcamentoData.status || 'Aguardando'
        })
        .eq('id', id)
        .select()
        .single();
      
      if (orcamentoError) throw orcamentoError;
      
      // Delete existing items
      await supabase
        .from('orcamento_items')
        .delete()
        .eq('orcamento_id', id);
      
      // Insert new items
      if (items && items.length > 0) {
        const itemsData = items.map((item) => {
          const itemPrice = typeof item.price === 'string' 
            ? parseFloat(item.price.replace(',', '.'))
            : item.price;
          
          return {
            orcamento_id: id,
            product_name: item.name,
            price: itemPrice,
            quantity: item.quantity
          };
        });
        
        const { error: itemsError } = await supabase
          .from('orcamento_items')
          .insert(itemsData);
        
        if (itemsError) throw itemsError;
      }
      
      return orcamento;
    },
    onSuccess: async (data) => {
      console.log('Orçamento atualizado com sucesso!');
      
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
      await refetch();
      
      addLog('edit', 'orcamento', data.title, `Cliente: ${data.client_name} - Total: R$ ${data.total}`);
      setModalOpen(false);
      setEditingBudget(null);
      
      toast({
        title: "Orçamento atualizado",
        description: `Orçamento para ${data.client_name} foi atualizado com sucesso.`,
      });
    },
    onError: (error) => {
      console.error('Erro ao atualizar orçamento:', error);
      toast({
        title: "Erro ao atualizar orçamento",
        description: "Não foi possível atualizar o orçamento. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Delete budget mutation
  const deleteBudgetMutation = useMutation({
    mutationFn: async (budgetId: string) => {
      const { error } = await supabase
        .from('orcamentos')
        .delete()
        .eq('id', budgetId);
      
      if (error) throw error;
      return budgetId;
    },
    onSuccess: async () => {
      console.log('Orçamento deletado com sucesso!');
      
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
      await refetch();
      
      toast({
        title: "Orçamento excluído",
        description: "O orçamento foi excluído com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Erro ao deletar orçamento:', error);
      toast({
        title: "Erro ao excluir orçamento",
        description: "Não foi possível excluir o orçamento. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Update status mutation with automatic agenda creation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: UpdateStatusData) => {
      const { data, error } = await supabase
        .from('orcamentos')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;

      // Se o status for "Venda Gerada", criar fatura automaticamente
      if (status === 'Venda Gerada') {
        console.log('Criando fatura automaticamente para venda gerada...');
        
        // Verificar se já existe uma fatura para este orçamento
        const { data: existingInvoice } = await supabase
          .from('faturas')
          .select('id')
          .eq('orcamento_id', data.id)
          .single();

        if (!existingInvoice) {
          const { error: faturaError } = await supabase
            .from('faturas')
            .insert({
              title: data.title,
              client_name: data.client_name,
              value: data.total,
              date: new Date().toISOString().split('T')[0], // Data atual
              orcamento_id: data.id,
              status: 'Pago'
            });

          if (faturaError) {
            console.error('Erro ao criar fatura automaticamente:', faturaError);
          } else {
            console.log('Fatura criada automaticamente para venda gerada');
          }
        }
      }
      
      return data;
    },
    onSuccess: async (data) => {
      console.log('Status atualizado com sucesso!');
      
      // Invalidar todas as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
      queryClient.invalidateQueries({ queryKey: ['orcamentos-agenda'] });
      queryClient.invalidateQueries({ queryKey: ['faturas'] });
      
      // Invalidar queries de vendas para atualização automática
      queryClient.invalidateQueries({ queryKey: ['vendas-geradas'] });
      queryClient.invalidateQueries({ queryKey: ['vendas-realizadas'] });
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      
      await refetch();
      
      addLog('edit', 'orcamento', data.title, `Status alterado para: ${data.status}`);
      
      let description = `Status do orçamento alterado para ${data.status}.`;
      if (data.status === 'Venda Gerada') {
        description += ' Fatura gerada automaticamente e venda enviada para agenda.';
      }
      
      toast({
        title: "Status atualizado",
        description: description,
      });
    },
    onError: (error) => {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro ao atualizar status",
        description: "Não foi possível atualizar o status. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  const formatCurrency = (value: number | string) => {
    const numericValue = typeof value === 'number' ? value : parseFloat(value || '0');
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numericValue);
  };

  const handleSaveBudget = async (budgetData: BudgetData) => {
    try {
      console.log('Salvando orçamento:', budgetData);
      
      if (editingBudget) {
        await updateBudgetMutation.mutateAsync({ ...budgetData, id: editingBudget.id });
      } else {
        await createBudgetMutation.mutateAsync(budgetData);
      }
    } catch (error) {
      console.error('Erro ao salvar orçamento:', error);
    }
  };

  const handleDeleteBudget = async (budgetId: string) => {
    const budget = budgets.find(b => b.id === budgetId);
    if (budget) {
      try {
        await deleteBudgetMutation.mutateAsync(budgetId);
        addLog('delete', 'orcamento', budget.title, `Cliente: ${budget.client_name}`);
      } catch (error) {
        console.error('Error deleting budget:', error);
      }
    }
  };

  const handleStatusChange = async (budgetId: string, newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id: budgetId, status: newStatus });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleEditBudget = (budget: any) => {
    // Transform the budget data to match the modal's expected format
    const transformedBudget = {
      ...budget,
      deliveryDate: formatDateToBrazilian(budget.delivery_date), // Usar delivery_date
      items: budget.orcamento_items || []
    };
    setEditingBudget(transformedBudget);
    setModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Venda Gerada':
        return 'bg-purple-600 text-white border-purple-600';
      case 'Aguardando':
        return 'bg-blue-600 text-white border-blue-600';
      default:
        return 'bg-gray-600 text-white border-gray-600';
    }
  };

  // Separar orçamentos por status - apenas Aguardando e Venda Gerada
  const pendingBudgets = budgets.filter(budget => budget.status === 'Aguardando');
  const salesGenerated = budgets.filter(budget => budget.status === 'Venda Gerada');

  if (isLoading) {
    return (
      <div className="p-6 bg-crm-dark min-h-screen flex items-center justify-center">
        <div className="text-white">Carregando orçamentos...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-crm-dark min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Orçamentos</h1>
        <div className="flex gap-2 items-center">
          <Button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar Lista
          </Button>
          <Button 
            onClick={() => {
              setEditingBudget(null);
              setModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={createBudgetMutation.isPending}
          >
            <Plus className="h-4 w-4 mr-2" />
            {createBudgetMutation.isPending ? 'Criando...' : 'Novo Orçamento'}
          </Button>
        </div>
      </div>

      {/* Status indicator */}
      {(isRefreshing || createBudgetMutation.isPending || updateBudgetMutation.isPending) && (
        <div className="mb-4 p-3 bg-blue-600/20 border border-blue-600/30 rounded-lg">
          <div className="text-blue-400 text-sm flex items-center">
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            {createBudgetMutation.isPending && 'Criando orçamento...'}
            {updateBudgetMutation.isPending && 'Atualizando orçamento...'}
            {isRefreshing && !createBudgetMutation.isPending && !updateBudgetMutation.isPending && 'Atualizando lista...'}
          </div>
        </div>
      )}

      {/* Tabs para separar orçamentos pendentes e vendas geradas */}
      <Tabs defaultValue="orcamentos" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-crm-dark mb-6">
          <TabsTrigger value="orcamentos" className="text-gray-300 data-[state=active]:text-white">
            Orçamentos Pendentes ({pendingBudgets.length})
          </TabsTrigger>
          <TabsTrigger value="vendas-geradas" className="text-gray-300 data-[state=active]:text-white">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Vendas Geradas ({salesGenerated.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orcamentos">
          {/* Orçamentos Pendentes */}
          <div className="grid grid-cols-1 gap-6">
            {pendingBudgets.map((budget) => {
              // Encontrar dados completos do cliente
              const cliente = clientes.find(c => c.name === budget.client_name);
              
              return (
                <Card key={budget.id} className="bg-crm-card border-crm-border">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-white">{budget.title}</h3>
                          <Select
                            value={budget.status}
                            onValueChange={(value) => handleStatusChange(budget.id, value)}
                            disabled={updateStatusMutation.isPending}
                          >
                            <SelectTrigger className={`w-36 ${getStatusColor(budget.status)} border-none`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-crm-dark border-crm-border">
                              <SelectItem value="Aguardando" className="text-white">Aguardando</SelectItem>
                              <SelectItem value="Venda Gerada" className="text-white">Venda Gerada</SelectItem>
                            </SelectContent>
                          </Select>
                          <PDFGenerator 
                            budget={budget} 
                            clientes={clientes}
                            disabled={updateBudgetMutation.isPending || deleteBudgetMutation.isPending}
                          />
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleEditBudget(budget)}
                            className="text-gray-400 hover:text-blue-400"
                            disabled={updateBudgetMutation.isPending}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleDeleteBudget(budget.id)}
                            className="text-gray-400 hover:text-red-400"
                            disabled={deleteBudgetMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-gray-400">{budget.client_name}</p>
                        {cliente?.address && (
                          <p className="text-gray-400 text-sm">Endereço: {cliente.address}</p>
                        )}
                        {cliente?.cidade && (
                          <p className="text-gray-400 text-sm">Cidade: {cliente.cidade}</p>
                        )}
                        <p className="text-gray-400 text-sm">Criado: {formatDateToBrazilian(budget.date)}</p>
                        {budget.delivery_date && (
                          <p className="text-gray-400 text-sm">Entrega: {formatDateToBrazilian(budget.delivery_date)}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400 text-sm">Total do Orçamento</p>
                        <p className="text-2xl font-bold text-blue-400">{formatCurrency(budget.total)}</p>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <h4 className="text-white font-medium mb-3">Itens do Orçamento:</h4>
                      <div className="space-y-2">
                        {budget.orcamento_items?.map((item: any, index: number) => (
                          <div key={index} className="flex justify-between text-gray-300">
                            <span>({item.quantity}x) - {item.product_name}</span>
                            <span>{formatCurrency(item.subtotal)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="vendas-geradas">
          {/* Vendas Geradas */}
          <div className="grid grid-cols-1 gap-6">
            {salesGenerated.map((budget) => {
              const cliente = clientes.find(c => c.name === budget.client_name);
              
              return (
                <Card key={budget.id} className="bg-crm-card border-crm-border border-purple-500/30">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-white">{budget.title}</h3>
                          <div className={`px-3 py-1 rounded ${getStatusColor(budget.status)} text-sm font-medium`}>
                            Venda Gerada
                          </div>
                          <PDFGenerator 
                            budget={budget} 
                            clientes={clientes}
                            disabled={false}
                          />
                        </div>
                        <p className="text-gray-400">{budget.client_name}</p>
                        {cliente?.address && (
                          <p className="text-gray-400 text-sm">Endereço: {cliente.address}</p>
                        )}
                        {cliente?.cidade && (
                          <p className="text-gray-400 text-sm">Cidade: {cliente.cidade}</p>
                        )}
                        <p className="text-gray-400 text-sm">Criado: {formatDateToBrazilian(budget.date)}</p>
                        {budget.delivery_date && (
                          <p className="text-gray-400 text-sm">Entrega: {formatDateToBrazilian(budget.delivery_date)}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400 text-sm">Valor da Venda</p>
                        <p className="text-2xl font-bold text-purple-400">{formatCurrency(budget.total)}</p>
                        <p className="text-purple-400 text-sm mt-1">✓ Venda Confirmada</p>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <h4 className="text-white font-medium mb-3">Itens Vendidos:</h4>
                      <div className="space-y-2">
                        {budget.orcamento_items?.map((item: any, index: number) => (
                          <div key={index} className="flex justify-between text-gray-300">
                            <span>({item.quantity}x) - {item.product_name}</span>
                            <span>{formatCurrency(item.subtotal)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <OrcamentoModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        clientes={clientes}
        produtos={produtos}
        budget={editingBudget}
        onSave={handleSaveBudget}
      />
    </div>
  );
}

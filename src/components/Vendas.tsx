
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, User, Calendar, DollarSign, Package, Check, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function Vendas() {
  const [showVendasRealizadas, setShowVendasRealizadas] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Buscar vendas geradas (para o botão Finalizar Serviço)
  const { data: vendasGeradas = [], isLoading: isLoadingGeradas, refetch: refetchGeradas } = useQuery({
    queryKey: ['vendas-geradas'],
    queryFn: async () => {
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
        .eq('status', 'Venda Gerada')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !showVendasRealizadas
  });

  // Buscar vendas realizadas (finalizadas)
  const { data: vendasRealizadas = [], isLoading: isLoadingRealizadas, refetch: refetchRealizadas } = useQuery({
    queryKey: ['vendas-realizadas'],
    queryFn: async () => {
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
        .eq('status', 'Finalizado')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: showVendasRealizadas
  });

  // Buscar clientes para filtros
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

  // Marcar venda como finalizada
  const finalizarVendaMutation = useMutation({
    mutationFn: async (vendaId: string) => {
      const { data, error } = await supabase
        .from('orcamentos')
        .update({ status: 'Finalizado' })
        .eq('id', vendaId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas-geradas'] });
      queryClient.invalidateQueries({ queryKey: ['vendas-realizadas'] });
      queryClient.invalidateQueries({ queryKey: ['orcamentos-agenda'] });
      refetchGeradas();
      
      toast({
        title: "Venda finalizada",
        description: "A venda foi marcada como finalizada com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Erro ao finalizar venda:', error);
      toast({
        title: "Erro ao finalizar venda",
        description: "Não foi possível finalizar a venda. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  const formatCurrency = (value: number | string) => {
    const numericValue = typeof value === 'number' ? value : parseFloat(value?.toString() || '0');
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numericValue);
  };

  const formatDateToBrazilian = (isoDate: string) => {
    if (!isoDate) return '';
    const date = new Date(isoDate + 'T12:00:00');
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  };

  const getTotalQuantity = (items: any[]) => {
    return items?.reduce((total, item) => total + (item.quantity || 0), 0) || 0;
  };

  const handleFinalizarVenda = (vendaId: string) => {
    finalizarVendaMutation.mutate(vendaId);
  };

  // Determinar quais dados usar baseado na tela atual
  const currentData = showVendasRealizadas ? vendasRealizadas : vendasGeradas;
  const isLoading = showVendasRealizadas ? isLoadingRealizadas : isLoadingGeradas;
  
  const filteredVendas = selectedStatus === "all" 
    ? currentData 
    : currentData.filter(venda => venda.client_name === selectedStatus);

  const clientesComVendas = Array.from(new Set(
    currentData.map(venda => venda.client_name)
  )).sort();

  if (isLoading) {
    return (
      <div className="p-6 bg-crm-dark min-h-screen flex items-center justify-center">
        <div className="text-white">Carregando vendas...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-crm-dark min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-8 w-8 text-green-400" />
          <h1 className="text-3xl font-bold text-white">
            {showVendasRealizadas ? "Vendas Realizadas" : "Vendas"}
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            onClick={() => {
              setShowVendasRealizadas(!showVendasRealizadas);
              setSelectedStatus("all");
            }}
            className={showVendasRealizadas ? "bg-gray-600 hover:bg-gray-700" : "bg-green-600 hover:bg-green-700"}
          >
            {showVendasRealizadas ? "← Voltar para Vendas" : "Vendas Realizadas"}
          </Button>
          
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400" />
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48 bg-crm-dark border-crm-border text-white">
                <SelectValue placeholder="Filtrar por cliente" />
              </SelectTrigger>
              <SelectContent className="bg-crm-dark border-crm-border">
                <SelectItem value="all" className="text-white">Todos os Clientes</SelectItem>
                {clientesComVendas.map((clientName) => (
                  <SelectItem key={clientName} value={clientName} className="text-white">
                    {clientName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={() => showVendasRealizadas ? refetchRealizadas() : refetchGeradas()}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-crm-card border-crm-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">
                  {showVendasRealizadas ? "Vendas Realizadas" : "Vendas Geradas"}
                </p>
                <p className="text-2xl font-bold text-green-400">{filteredVendas.length}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-crm-card border-crm-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Valor Total</p>
                <p className="text-2xl font-bold text-green-400">
                  {formatCurrency(filteredVendas.reduce((total, venda) => total + parseFloat(venda.total?.toString() || '0'), 0))}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-crm-card border-crm-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Produtos Vendidos</p>
                <p className="text-2xl font-bold text-green-400">
                  {filteredVendas.reduce((total, venda) => total + getTotalQuantity(venda.orcamento_items), 0)}
                </p>
              </div>
              <Package className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Vendas */}
      {filteredVendas.length === 0 ? (
        <Card className="bg-crm-card border-crm-border">
          <CardContent className="p-8 text-center">
            <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {showVendasRealizadas ? "Nenhuma venda realizada encontrada" : "Nenhuma venda encontrada"}
            </h3>
            <p className="text-gray-400">
              {selectedStatus === "all" 
                ? (showVendasRealizadas ? "Nenhuma venda foi finalizada ainda." : "Nenhuma venda foi registrada ainda.")
                : `Nenhuma venda encontrada para ${selectedStatus}.`
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredVendas.map((venda) => {
            const cliente = clientes.find(c => c.name === venda.client_name);
            
            return (
              <Card key={venda.id} className="bg-crm-card border-crm-border border-green-500/30">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-xl text-white">{venda.title}</CardTitle>
                      <Badge className={showVendasRealizadas ? "bg-blue-600 text-white" : "bg-green-600 text-white"}>
                        {showVendasRealizadas ? "Serviço Finalizado" : "Venda Confirmada"}
                      </Badge>
                    </div>
                    {!showVendasRealizadas && (
                      <Button
                        onClick={() => handleFinalizarVenda(venda.id)}
                        disabled={finalizarVendaMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Finalizar Serviço
                      </Button>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-300">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{venda.client_name}</span>
                      </div>
                      
                      {cliente?.address && (
                        <p className="text-gray-400 text-sm ml-6">Endereço: {cliente.address}</p>
                      )}
                      
                      {cliente?.cidade && (
                        <p className="text-gray-400 text-sm ml-6">Cidade: {cliente.cidade}</p>
                      )}
                      
                      <div className="flex items-center gap-2 text-gray-300">
                        <Calendar className="h-4 w-4" />
                        <span>Venda: {formatDateToBrazilian(venda.date)}</span>
                      </div>
                      
                      {venda.delivery_date && (
                        <div className="flex items-center gap-2 text-gray-300">
                          <Calendar className="h-4 w-4" />
                          <span>Entrega: {formatDateToBrazilian(venda.delivery_date)}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <p className="text-gray-400 text-sm">Valor da Venda</p>
                      <p className="text-3xl font-bold text-green-400">{formatCurrency(venda.total)}</p>
                      <div className="flex items-center justify-end gap-2 text-gray-300 mt-2">
                        <Package className="h-4 w-4" />
                        <span>{getTotalQuantity(venda.orcamento_items)} itens</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-crm-border pt-4">
                    <h4 className="text-white font-medium mb-3">Produtos Vendidos:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {venda.orcamento_items?.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between text-gray-300 p-2 bg-crm-dark rounded">
                          <span>({item.quantity}x) {item.product_name}</span>
                          <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

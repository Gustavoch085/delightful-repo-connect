
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Edit, Trash2, Users } from "lucide-react";
import { ClienteModal } from "./modals/ClienteModal";
import { useLogs } from "@/contexts/LogsContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function Clientes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const { addLog } = useLogs();
  const queryClient = useQueryClient();

  // Fetch clients from Supabase
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch budgets to calculate client stats
  const { data: budgets = [] } = useQuery({
    queryKey: ['orcamentos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orcamentos')
        .select('client_name, total');
      
      if (error) throw error;
      return data;
    }
  });

  // Create client mutation
  const createClientMutation = useMutation({
    mutationFn: async (clientData: any) => {
      const dataToInsert = {
        name: clientData.name,
        phone: clientData.phone,
        address: clientData.address,
        email: clientData.email || null
      };

      console.log('Inserting client data:', dataToInsert);

      const { data, error } = await supabase
        .from('clientes')
        .insert([dataToInsert])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      addLog('create', 'cliente', data.name);
    }
  });

  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: async ({ id, ...clientData }: any) => {
      const dataToUpdate = {
        name: clientData.name,
        phone: clientData.phone,
        address: clientData.address,
        email: clientData.email || null
      };

      console.log('Updating client data:', dataToUpdate);

      const { data, error } = await supabase
        .from('clientes')
        .update(dataToUpdate)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      addLog('edit', 'cliente', data.name);
    }
  });

  // Delete client mutation
  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', clientId);
      
      if (error) throw error;
      return clientId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    }
  });

  const formatCurrency = (value: number | string) => {
    const numericValue = typeof value === 'number' ? value : parseFloat(value.toString());
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numericValue);
  };

  const calculateClientStats = (clientName: string) => {
    const clientBudgets = budgets.filter(budget => budget.client_name === clientName);
    const totalSpent = clientBudgets.reduce((total, budget) => {
      return total + parseFloat(budget.total?.toString() || '0');
    }, 0);
    
    return {
      totalSpent: formatCurrency(totalSpent),
      orders: clientBudgets.length
    };
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm) ||
    client.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveClient = async (clientData: any) => {
    try {
      console.log('Saving client:', clientData);
      if (editingClient) {
        await updateClientMutation.mutateAsync({ ...clientData, id: editingClient.id });
        setEditingClient(null);
      } else {
        await createClientMutation.mutateAsync(clientData);
      }
      setModalOpen(false);
    } catch (error) {
      console.error('Error saving client:', error);
    }
  };

  const handleEditClient = (client: any) => {
    setEditingClient(client);
    setModalOpen(true);
  };

  const handleDeleteClient = async (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      try {
        await deleteClientMutation.mutateAsync(clientId);
        addLog('delete', 'cliente', client.name);
      } catch (error) {
        console.error('Error deleting client:', error);
      }
    }
  };

  const handleNewClient = () => {
    setEditingClient(null);
    setModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-crm-dark min-h-screen flex items-center justify-center">
        <div className="text-white">Carregando clientes...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-crm-dark min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Clientes</h1>
        <Button onClick={handleNewClient} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Buscar clientes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-crm-card border-crm-border text-white placeholder-gray-400"
        />
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => {
          const stats = calculateClientStats(client.name);
          
          return (
            <Card key={client.id} className="bg-crm-card border-crm-border">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{client.name}</h3>
                      <p className="text-gray-400 text-sm">{client.phone}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleEditClient(client)}
                      className="text-gray-400 hover:text-white"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleDeleteClient(client.id)}
                      className="text-gray-400 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <p className="text-gray-300 text-sm mb-4">{client.address}</p>
                
                <div className="flex justify-between items-center pt-4 border-t border-crm-border">
                  <div>
                    <p className="text-gray-400 text-xs">Total gasto</p>
                    <p className="text-green-400 font-semibold">{stats.totalSpent}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Pedidos</p>
                    <p className="text-white font-semibold">{stats.orders}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ClienteModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        cliente={editingClient}
        onSave={handleSaveClient}
      />
    </div>
  );
}

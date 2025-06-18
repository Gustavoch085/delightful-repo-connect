
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Edit, Trash2, FileText, Tag } from "lucide-react";
import { ProdutoModal } from "./modals/ProdutoModal";
import { LoadingScreen } from "./LoadingScreen";
import { useLogs } from "@/contexts/LogsContext";
import { useDataContext } from "@/contexts/DataContext";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePreloadedProducts } from "@/hooks/usePreloadedData";

export function Produtos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const { addLog } = useLogs();
  const { isPreloading } = useDataContext();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = usePreloadedProducts();

  const createProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      const priceValue = typeof productData.price === 'string' 
        ? parseFloat(productData.price.replace('R$ ', '').replace('.', '').replace(',', '.'))
        : productData.price;

      const dataToInsert = {
        name: productData.name,
        price: priceValue,
        description: productData.description || null,
        category: productData.category || null
      };

      const { data, error } = await supabase
        .from('produtos')
        .insert([dataToInsert])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      addLog('create', 'produto', data.name);
    }
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, ...productData }: any) => {
      const priceValue = typeof productData.price === 'string' 
        ? parseFloat(productData.price.replace('R$ ', '').replace('.', '').replace(',', '.'))
        : productData.price;

      const dataToUpdate = {
        name: productData.name,
        price: priceValue,
        description: productData.description || null,
        category: productData.category || null
      };

      const { data, error } = await supabase
        .from('produtos')
        .update(dataToUpdate)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      addLog('edit', 'produto', data.name);
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('produtos')
        .delete()
        .eq('id', productId);
      
      if (error) throw error;
      return productId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
    }
  });

  const formatCurrency = (value: number | string) => {
    const numericValue = typeof value === 'number' ? value : parseFloat(value.toString());
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numericValue);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveProduct = async (productData: any) => {
    try {
      if (editingProduct) {
        await updateProductMutation.mutateAsync({ ...productData, id: editingProduct.id });
        setEditingProduct(null);
      } else {
        await createProductMutation.mutateAsync(productData);
      }
      setModalOpen(false);
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      try {
        await deleteProductMutation.mutateAsync(productId);
        addLog('delete', 'produto', product.name);
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const handleNewProduct = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  if (isPreloading || isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="p-6 bg-crm-dark min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Produtos</h1>
        <Button onClick={handleNewProduct} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Buscar produtos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-crm-card border-crm-border text-white placeholder-gray-400"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="bg-crm-card border-crm-border">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-1">{product.name}</h3>
                    <p className="text-green-400 font-bold text-lg">{formatCurrency(product.price)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => handleEditProduct(product)}
                    className="text-gray-400 hover:text-white"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => handleDeleteProduct(product.id)}
                    className="text-gray-400 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {product.description && (
                  <div>
                    <p className="text-gray-400 text-sm">Descrição:</p>
                    <p className="text-gray-300 text-sm">{product.description}</p>
                  </div>
                )}
                
                {product.category && (
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-300 text-sm">{product.category}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ProdutoModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        produto={editingProduct}
        onSave={handleSaveProduct}
      />
    </div>
  );
}

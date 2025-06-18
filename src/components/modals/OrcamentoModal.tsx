
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

interface OrcamentoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientes: any[];
  produtos: any[];
  budget?: any;
  onSave: (orcamento: any) => void;
}

export function OrcamentoModal({ open, onOpenChange, clientes, produtos, budget, onSave }: OrcamentoModalProps) {
  const [selectedClient, setSelectedClient] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [items, setItems] = useState([{ product: "", quantity: 1, price: 0, priceInput: "" }]);

  useEffect(() => {
    if (budget) {
      setSelectedClient(budget.client_name || "");
      // Se tem data de entrega salva, formata para DD/MM/AAAA
      if (budget.deliveryDate) {
        setDeliveryDate(budget.deliveryDate);
      } else {
        setDeliveryDate("");
      }
      setItems(budget.items?.map((item: any) => ({
        product: item.product_name || item.name || "",
        quantity: item.quantity,
        price: parseFloat(item.price),
        priceInput: formatPriceInput(parseFloat(item.price))
      })) || [{ product: "", quantity: 1, price: 0, priceInput: "" }]);
    } else {
      setSelectedClient("");
      setDeliveryDate("");
      setItems([{ product: "", quantity: 1, price: 0, priceInput: "" }]);
    }
  }, [budget, open]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const parsePrice = (priceString: string | number) => {
    // Se for número, retorna diretamente
    if (typeof priceString === 'number') {
      return priceString;
    }
    
    // Se for string, processa
    let cleanValue = priceString.toString().replace(/[^\d,.]/g, '');
    
    // Se contém vírgula, assumimos formato brasileiro (ex: 1.500,00)
    if (cleanValue.includes(',')) {
      // Remove pontos (separadores de milhares) e substitui vírgula por ponto
      cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
    }
    
    const numberValue = parseFloat(cleanValue);
    return isNaN(numberValue) ? 0 : numberValue;
  };

  const formatPriceInput = (value: number) => {
    if (value === 0) return '';
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleDateChange = (value: string) => {
    // Remove tudo que não for número
    const numbersOnly = value.replace(/\D/g, '');
    
    // Aplica a máscara DD/MM/AAAA
    let formattedDate = '';
    for (let i = 0; i < numbersOnly.length && i < 8; i++) {
      if (i === 2 || i === 4) {
        formattedDate += '/';
      }
      formattedDate += numbersOnly[i];
    }
    
    setDeliveryDate(formattedDate);
  };

  const addItem = () => {
    setItems([...items, { product: "", quantity: 1, price: 0, priceInput: "" }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === "product") {
      const selectedProduct = produtos.find(p => p.name === value);
      if (selectedProduct) {
        // Usar a função parsePrice para converter o preço
        const priceValue = parsePrice(selectedProduct.price);
        newItems[index].price = priceValue;
        newItems[index].priceInput = formatPriceInput(priceValue);
      }
    }
    
    setItems(newItems);
  };

  const handlePriceChange = (index: number, inputValue: string) => {
    const newItems = [...items];
    newItems[index].priceInput = inputValue;
    
    // Só atualiza o preço numérico se o input não estiver vazio
    if (inputValue.trim() !== '') {
      const priceValue = parsePrice(inputValue);
      newItems[index].price = priceValue;
    } else {
      newItems[index].price = 0;
    }
    
    setItems(newItems);
  };

  const calculateTotal = () => {
    const total = items.reduce((total, item) => total + (item.quantity * item.price), 0);
    return formatCurrency(total);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filtra apenas itens com produtos selecionados e converte para o formato correto
    const validItems = items
      .filter(item => item.product && item.quantity > 0)
      .map(item => ({
        quantity: item.quantity,
        name: item.product,
        price: item.price.toFixed(2)
      }));

    const totalValue = items.reduce((total, item) => total + (item.quantity * item.price), 0);

    const orcamento = {
      id: budget?.id || Date.now(),
      title: budget?.title || `Orçamento #${Date.now()}`,
      client: selectedClient,
      date: budget?.date || new Date().toLocaleDateString('pt-BR'),
      deliveryDate: deliveryDate,
      total: totalValue,
      status: budget?.status || "Aguardando",
      items: validItems,
    };

    console.log('Salvando orçamento:', orcamento);
    onSave(orcamento);
    onOpenChange(false);
    
    // Reset form se não for edição
    if (!budget) {
      setSelectedClient("");
      setDeliveryDate("");
      setItems([{ product: "", quantity: 1, price: 0, priceInput: "" }]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-crm-card border-crm-border text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>{budget ? "Editar Orçamento" : "Novo Orçamento"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="client">Cliente *</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient} required>
                <SelectTrigger className="bg-crm-dark border-crm-border text-white">
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent className="bg-crm-dark border-crm-border">
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.name} className="text-white">
                      {cliente.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="deliveryDate">Data de Entrega</Label>
              <Input
                id="deliveryDate"
                type="text"
                value={deliveryDate}
                onChange={(e) => handleDateChange(e.target.value)}
                placeholder="DD/MM/AAAA"
                maxLength={10}
                className="bg-crm-dark border-crm-border text-white"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <Label>Produtos</Label>
              <Button type="button" size="sm" onClick={addItem} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Item
              </Button>
            </div>
            
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex gap-3 items-end p-3 border border-crm-border rounded-lg">
                  <div className="flex-1">
                    <Label>Produto</Label>
                    <Select 
                      value={item.product} 
                      onValueChange={(value) => updateItem(index, "product", value)}
                    >
                      <SelectTrigger className="bg-crm-dark border-crm-border text-white">
                        <SelectValue placeholder="Produto" />
                      </SelectTrigger>
                      <SelectContent className="bg-crm-dark border-crm-border">
                        {produtos.map((produto) => (
                          <SelectItem key={produto.id} value={produto.name} className="text-white">
                            {produto.name} - {formatCurrency(produto.price)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="w-20">
                    <Label>Qtd</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                      className="bg-crm-dark border-crm-border text-white"
                    />
                  </div>
                  
                  <div className="w-32">
                    <Label>Preço</Label>
                    <Input
                      type="text"
                      value={item.priceInput}
                      onChange={(e) => handlePriceChange(index, e.target.value)}
                      placeholder="0,00"
                      className="bg-crm-dark border-crm-border text-white"
                    />
                  </div>
                  
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeItem(index)}
                    className="text-red-400 hover:text-red-300"
                    disabled={items.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Total do Orçamento:</span>
            <span className="text-blue-400">{calculateTotal()}</span>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {budget ? "Atualizar Orçamento" : "Criar Orçamento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

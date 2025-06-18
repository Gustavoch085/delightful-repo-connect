
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProdutoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produto?: any;
  onSave: (produto: any) => void;
}

export function ProdutoModal({ open, onOpenChange, produto, onSave }: ProdutoModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    category: "",
  });

  useEffect(() => {
    if (produto) {
      setFormData({
        name: produto.name || "",
        price: produto.price ? formatPriceInput(produto.price) : "",
        description: produto.description || "",
        category: produto.category || "",
      });
    } else {
      setFormData({
        name: "",
        price: "",
        description: "",
        category: "",
      });
    }
  }, [produto, open]);

  const formatPriceInput = (value: number | string) => {
    if (typeof value === 'number') {
      return value.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
    // If it's already a string, extract numeric value
    const numericValue = parseFloat(value.toString().replace(/[^\d,]/g, '').replace(',', '.'));
    if (isNaN(numericValue)) return '';
    return numericValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatPrice = (value: string) => {
    // Remove tudo que não for número
    const numbers = value.replace(/\D/g, '');
    
    if (!numbers) return '';
    
    // Converte para número e formata
    const numberValue = parseFloat(numbers) / 100;
    
    return numberValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formattedValue = formatPrice(value);
    setFormData({ ...formData, price: formattedValue });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting product data:', formData);
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-crm-card border-crm-border text-white">
        <DialogHeader>
          <DialogTitle>{produto ? "Editar Produto" : "Novo Produto"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Produto *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-crm-dark border-crm-border text-white"
              required
            />
          </div>
          <div>
            <Label htmlFor="price">Preço *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                R$
              </span>
              <Input
                id="price"
                value={formData.price}
                onChange={handlePriceChange}
                className="bg-crm-dark border-crm-border text-white pl-10"
                placeholder="0,00"
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-crm-dark border-crm-border text-white"
            />
          </div>
          <div>
            <Label htmlFor="category">Categoria</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="bg-crm-dark border-crm-border text-white"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {produto ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

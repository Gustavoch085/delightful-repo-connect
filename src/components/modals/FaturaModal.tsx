
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface FaturaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fatura?: any;
  onSave: (fatura: any) => void;
}

export function FaturaModal({ open, onOpenChange, fatura, onSave }: FaturaModalProps) {
  const [formData, setFormData] = useState({
    title: fatura?.title || "",
    client: fatura?.client || "",
    value: fatura?.value ? fatura.value.replace('+ R$ ', '').replace('.', '').replace(',', '.') : "",
    date: fatura?.date || new Date().toISOString().split('T')[0],
  });

  // Busca clientes do Supabase
  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

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

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formattedValue = formatPrice(value);
    setFormData({ ...formData, value: formattedValue });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: fatura?.id || Date.now(),
      value: `+ R$ ${formData.value}`,
    });
    onOpenChange(false);
    setFormData({ title: "", client: "", value: "", date: new Date().toISOString().split('T')[0] });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-crm-card border-crm-border text-white">
        <DialogHeader>
          <DialogTitle>{fatura ? "Editar Fatura" : "Nova Fatura"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-crm-dark border-crm-border text-white"
              required
            />
          </div>
          <div>
            <Label htmlFor="client">Cliente *</Label>
            <Select value={formData.client} onValueChange={(value) => setFormData({ ...formData, client: value })} required>
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
            <Label htmlFor="value">Valor</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                R$
              </span>
              <Input
                id="value"
                value={formData.value}
                onChange={handleValueChange}
                className="bg-crm-dark border-crm-border text-white pl-10"
                placeholder="0,00"
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="bg-crm-dark border-crm-border text-white"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              {fatura ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

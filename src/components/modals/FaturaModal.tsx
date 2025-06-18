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
    date: fatura?.date || "",
  });

  useEffect(() => {
    if (fatura) {
      // Se tem fatura para editar, formatar a data para DD/MM/AAAA
      const dateFormatted = fatura.date ? formatDateToDisplay(fatura.date) : "";
      setFormData({
        title: fatura.title || "",
        client: fatura.client || "",
        value: fatura.value ? fatura.value.replace('+ R$ ', '').replace('.', '').replace(',', '.') : "",
        date: dateFormatted,
      });
    } else {
      // Se é nova fatura, usar data atual formatada
      const today = new Date();
      const todayFormatted = formatDateToDisplay(today);
      setFormData({
        title: "",
        client: "",
        value: "",
        date: todayFormatted,
      });
    }
  }, [fatura, open]);

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

  const formatDateToDisplay = (dateInput: string | Date) => {
    if (!dateInput) return "";
    
    let date: Date;
    if (typeof dateInput === 'string') {
      // Se é string no formato YYYY-MM-DD, criar data com horário do meio-dia para evitar problemas de timezone
      if (dateInput.includes('-')) {
        const [year, month, day] = dateInput.split('-');
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
      } else {
        date = new Date(dateInput);
      }
    } else {
      date = dateInput;
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDateToISO = (dateString: string) => {
    if (!dateString || dateString.length !== 10) return "";
    const [day, month, year] = dateString.split('/');
    // Criar data com horário do meio-dia para evitar problemas de timezone
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
    return date.toISOString().split('T')[0];
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
    
    setFormData({ ...formData, date: formattedDate });
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

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formattedValue = formatPrice(value);
    setFormData({ ...formData, value: formattedValue });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Converter data para formato ISO antes de salvar
    const isoDate = formatDateToISO(formData.date);
    if (!isoDate) {
      alert('Por favor, insira uma data válida no formato DD/MM/AAAA');
      return;
    }

    onSave({
      ...formData,
      id: fatura?.id || Date.now(),
      value: `+ R$ ${formData.value}`,
      date: isoDate,
    });
    onOpenChange(false);
    
    // Reset form se não for edição
    if (!fatura) {
      const today = new Date();
      const todayFormatted = formatDateToDisplay(today);
      setFormData({ title: "", client: "", value: "", date: todayFormatted });
    }
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
              type="text"
              value={formData.date}
              onChange={(e) => handleDateChange(e.target.value)}
              placeholder="DD/MM/AAAA"
              maxLength={10}
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

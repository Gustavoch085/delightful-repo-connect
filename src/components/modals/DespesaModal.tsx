
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface DespesaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  despesa?: any;
  onSave: (despesa: any) => void;
}

export function DespesaModal({ open, onOpenChange, despesa, onSave }: DespesaModalProps) {
  const [formData, setFormData] = useState({
    title: despesa?.title || "",
    client: despesa?.client || "",
    value: despesa?.value ? despesa.value.replace('- R$ ', '').replace('.', '').replace(',', '.') : "",
    date: despesa?.date || "",
  });

  useEffect(() => {
    if (despesa) {
      // Se tem despesa para editar, formatar a data para DD/MM/AAAA
      const dateFormatted = despesa.date ? formatDateToDisplay(despesa.date) : "";
      setFormData({
        title: despesa.title || "",
        client: despesa.client || "",
        value: despesa.value ? despesa.value.replace('- R$ ', '').replace('.', '').replace(',', '.') : "",
        date: dateFormatted,
      });
    } else {
      // Se é nova despesa, usar data atual formatada
      const today = new Date();
      const todayFormatted = formatDateToDisplay(today.toISOString().split('T')[0]);
      setFormData({
        title: "",
        client: "",
        value: "",
        date: todayFormatted,
      });
    }
  }, [despesa, open]);

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

  const formatDateToDisplay = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDateToISO = (dateString: string) => {
    if (!dateString || dateString.length !== 10) return "";
    const [day, month, year] = dateString.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
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
      id: despesa?.id || Date.now(),
      value: `- R$ ${formData.value}`,
      date: isoDate,
    });
    onOpenChange(false);
    
    // Reset form se não for edição
    if (!despesa) {
      const today = new Date();
      const todayFormatted = formatDateToDisplay(today.toISOString().split('T')[0]);
      setFormData({ title: "", client: "", value: "", date: todayFormatted });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-crm-card border-crm-border text-white">
        <DialogHeader>
          <DialogTitle>{despesa ? "Editar Despesa" : "Nova Despesa"}</DialogTitle>
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
            <Button type="submit" className="bg-red-600 hover:bg-red-700">
              {despesa ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

-- Criar tabela relatorios_mensais para relatórios mensais
CREATE TABLE public.relatorios_mensais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pendente',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  value NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.relatorios_mensais ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Enable all operations for relatorios_mensais" 
ON public.relatorios_mensais 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Criar trigger para updated_at
CREATE TRIGGER update_relatorios_mensais_updated_at
BEFORE UPDATE ON public.relatorios_mensais
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar campos ausentes na tabela faturas
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Pendente';

-- Adicionar campo date na tabela orcamentos para compatibilidade
ALTER TABLE public.orcamentos ADD COLUMN IF NOT EXISTS date DATE GENERATED ALWAYS AS (created_at::date) STORED;

-- Criar tabela para armazenar relatórios mensais arquivados
CREATE TABLE public.relatorios_mensais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mes INTEGER NOT NULL,
  ano INTEGER NOT NULL,
  total_receitas NUMERIC NOT NULL DEFAULT 0,
  total_despesas NUMERIC NOT NULL DEFAULT 0,
  lucro_liquido NUMERIC NOT NULL DEFAULT 0,
  despesas JSONB NOT NULL DEFAULT '[]'::jsonb,
  faturas JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(mes, ano)
);

-- Adicionar RLS na tabela
ALTER TABLE public.relatorios_mensais ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso completo (já que não tem autenticação)
CREATE POLICY "Allow all access to relatorios_mensais" 
  ON public.relatorios_mensais 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

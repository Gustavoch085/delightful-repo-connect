-- Criar tabela orcamento_items para armazenar os itens dos orçamentos
CREATE TABLE public.orcamento_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  orcamento_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  subtotal NUMERIC GENERATED ALWAYS AS (price * quantity) STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.orcamento_items ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Enable all operations for orcamento_items" 
ON public.orcamento_items 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Adicionar foreign key para orcamentos
ALTER TABLE public.orcamento_items 
ADD CONSTRAINT orcamento_items_orcamento_id_fkey 
FOREIGN KEY (orcamento_id) REFERENCES public.orcamentos(id) ON DELETE CASCADE;

-- Criar trigger para updated_at
CREATE TRIGGER update_orcamento_items_updated_at
BEFORE UPDATE ON public.orcamento_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índices para melhor performance
CREATE INDEX idx_orcamento_items_orcamento_id ON public.orcamento_items(orcamento_id);

-- Atualizar a tabela faturas para adicionar campos necessários para integração com vendas
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS orcamento_id UUID;
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS value NUMERIC DEFAULT 0;

-- Adicionar foreign key para faturas
ALTER TABLE public.faturas 
ADD CONSTRAINT faturas_orcamento_id_fkey 
FOREIGN KEY (orcamento_id) REFERENCES public.orcamentos(id) ON DELETE SET NULL;
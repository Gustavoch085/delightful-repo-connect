
-- Primeiro, vamos fazer backup dos dados existentes
CREATE TEMP TABLE despesas_backup AS SELECT * FROM despesas;
CREATE TEMP TABLE faturas_backup AS SELECT * FROM faturas;

-- Dropar as tabelas existentes
DROP TABLE IF EXISTS despesas CASCADE;
DROP TABLE IF EXISTS faturas CASCADE;

-- Recriar a tabela despesas com timezone brasileiro
CREATE TABLE public.despesas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  value NUMERIC NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')
);

-- Recriar a tabela faturas com timezone brasileiro
CREATE TABLE public.faturas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_id UUID REFERENCES public.clientes(id),
  value NUMERIC NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pendente'::text,
  orcamento_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')
);

-- Criar trigger para atualizar updated_at automaticamente na tabela despesas
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = (now() AT TIME ZONE 'America/Sao_Paulo');
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_despesas_updated_at 
    BEFORE UPDATE ON despesas 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Criar trigger para atualizar updated_at automaticamente na tabela faturas
CREATE TRIGGER update_faturas_updated_at 
    BEFORE UPDATE ON faturas 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Restaurar os dados convertendo as datas para o timezone brasileiro
INSERT INTO despesas (id, title, category, value, date, description, created_at, updated_at)
SELECT 
  id, 
  title, 
  category, 
  value, 
  date,
  description,
  created_at AT TIME ZONE 'America/Sao_Paulo',
  updated_at AT TIME ZONE 'America/Sao_Paulo'
FROM despesas_backup;

INSERT INTO faturas (id, title, client_name, client_id, value, date, status, orcamento_id, created_at, updated_at)
SELECT 
  id, 
  title, 
  client_name, 
  client_id, 
  value, 
  date,
  status,
  orcamento_id,
  created_at AT TIME ZONE 'America/Sao_Paulo',
  updated_at AT TIME ZONE 'America/Sao_Paulo'
FROM faturas_backup;

-- Limpar tabelas temporárias
DROP TABLE despesas_backup;
DROP TABLE faturas_backup;

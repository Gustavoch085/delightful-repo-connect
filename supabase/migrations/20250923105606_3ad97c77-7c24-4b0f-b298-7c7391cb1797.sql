-- Fix database schema to match code expectations

-- Add missing columns to faturas table
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Pendente';

-- Add missing columns to despesas table  
ALTER TABLE public.despesas ADD COLUMN IF NOT EXISTS title TEXT;

-- Remove the generated date column from orcamentos and add a proper date column
ALTER TABLE public.orcamentos DROP COLUMN IF EXISTS date;
ALTER TABLE public.orcamentos ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;

-- Update orcamento_items column to be properly structured as JSONB array
-- No changes needed as it's already JSONB and should work with proper typing

-- Ensure relatorios_mensais table exists (already created in previous migration)
-- CREATE TABLE public.relatorios_mensais already exists

-- Update faturas table to include all required fields for compatibility
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS amount NUMERIC DEFAULT 0;
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS value NUMERIC DEFAULT 0;
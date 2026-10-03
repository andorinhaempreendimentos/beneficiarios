-- Migration: 051_supervisoes_campos_relatorio.sql
-- Adiciona campos específicos para preenchimento de supervisão e geração do relatório mensal

ALTER TABLE supervisoes
ADD COLUMN IF NOT EXISTS atividade_desenvolvida text,
ADD COLUMN IF NOT EXISTS orientacoes_professor text,
ADD COLUMN IF NOT EXISTS providencias_necessarias text;

-- Migration 051: Ampliação do tamanho do campo tamanho_uniforme para suportar tamanhos categorizados (ex: 'TAM 10-12', '10-12')
ALTER TABLE public.beneficiarios
  ALTER COLUMN tamanho_uniforme TYPE varchar(20);

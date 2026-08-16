-- Migration: Auto-encerramento de aulas
-- Adiciona status 'encerrada_automaticamente' e cron job para fechar aulas esquecidas

-- 1. Adicionar novo valor ao enum de status
ALTER TYPE status_execucao_aula ADD VALUE IF NOT EXISTS 'encerrada_automaticamente';

-- 2. Habilitar extensão pg_cron (já pode estar habilitada)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 3. Função que auto-encerra aulas que passaram de hora_fim_prevista + 2 minutos
CREATE OR REPLACE FUNCTION auto_encerrar_aulas()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE execucoes_aula
  SET
    status = 'encerrada_automaticamente',
    hora_fim_real = (data || ' ' || hora_fim_prevista::text)::timestamp AT TIME ZONE 'America/Sao_Paulo' AT TIME ZONE 'UTC',
    atualizado_em = now(),
    observacoes = COALESCE(observacoes || E'\n\n', '') || '[ENCERRADA AUTOMATICAMENTE] Aula não foi encerrada manualmente pelo professor.'
  WHERE
    status = 'em_andamento'
    AND (
      (data + hora_fim_prevista + INTERVAL '2 minutes')
      < (now() AT TIME ZONE 'America/Sao_Paulo')
    );
END;
$$;

-- 4. Agendar cron para rodar a cada minuto
SELECT cron.schedule(
  'auto-encerrar-aulas',
  '* * * * *',
  'SELECT auto_encerrar_aulas()'
);

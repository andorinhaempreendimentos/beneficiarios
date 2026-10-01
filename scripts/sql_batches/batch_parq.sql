BEGIN;
INSERT INTO beneficiario_parq (id, beneficiario_id, data_resposta, respostas, created_at, updated_at)
SELECT gen_random_uuid(), b.id, '2026-08-01'::date,
'[{"pergunta":"Algum médico já disse que possui problema de coração e recomendou só praticar atividade física supervisionado?","resposta":"Não"},{"pergunta":"Sente dor no peito quando pratica atividade física?","resposta":"Não"},{"pergunta":"No último mês, sentiu dor no peito quando não estava praticando atividade física?","resposta":"Não"},{"pergunta":"Perde o equilíbrio devido a tontura ou já perdeu a consciência?","resposta":"Não"},{"pergunta":"Tem algum problema ósseo ou articular que poderia ser piorado pela atividade física?","resposta":"Não"},{"pergunta":"Toma atualmente algum medicamento para pressão arterial ou problema de coração?","resposta":"Não"},{"pergunta":"Sabe de outra razão pela qual não deveria praticar atividade física?","resposta":"Não"},{"pergunta":"Tem diabetes controlada com insulina?","resposta":"Não"},{"pergunta":"Tem mais de 65 anos e não está acostumado a praticar atividade física?","resposta":"Não"},{"pergunta":"Está gestante ou suspeita estar gestante?","resposta":"Não"}]'::jsonb,
NOW(), NOW()
FROM beneficiarios b
WHERE NOT EXISTS (SELECT 1 FROM beneficiario_parq p WHERE p.beneficiario_id = b.id);
COMMIT;

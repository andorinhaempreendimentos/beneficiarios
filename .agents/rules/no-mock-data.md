# Regras Estritas do Projeto — Andorinha Beneficiários

## Regra Fundamental: PROIBIDO DADOS MOCADOS
- **Nunca mockar, simular ou inventar dados** (ex: números fictícios, arrays estáticos de demonstração, estimativas de vagas/alunos ou registros de exemplo) sem que o usuário peça **expressamente**.
- Toda interface, dashboard, formulário, listagem ou relatório deve consumir **100% de dados reais** provenientes do banco de dados (Supabase) ou das APIs integradas.
- Caso uma tabela ou entidade não possua registros no momento, exibir a contagem zerada (`0`) ou o devido *Empty State* didático (*"Nenhum registro encontrado"*), sem gerar dados estáticos.

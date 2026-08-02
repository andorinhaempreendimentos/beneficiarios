---
name: descreva
description: Analisa código HTML/interface de formulários ou telas de referência e gera documentação estruturada em Markdown na pasta informacoes.
---

# Skill: ##descreva

## Objetivo
Analisar códigos HTML/interfaces enviadas pelo usuário e gerar arquivos `.md` explicativos e padronizados dentro da pasta `informacoes/`.

## Regras de Execução

1. **Análise do Código:**
   - Identificar o título/propósito da tela ou formulário.
   - Extrair todos os campos de entrada (inputs, selects, checkboxes, switches, textareas, etc.).
   - Não incluir IDs internos específicos do HTML (como `id="school_name"` ou `name="school[name]"`), mantendo a documentação focada nos tipos e conceitos funcionais.
   - Identificar obrigatoriedade de cada campo (`Obrigatório` ou `Opcional`).
   - Identificar os botões e ações da página.

2. **Geração do Arquivo Markdown:**
   - Salvar o arquivo na pasta `informacoes/` com um nome descritivo (ex: `formulario_beneficiario.md`, `formulario_atividade.md`).
   - Estrutura padrão do arquivo:

```markdown
# Formulário: [Nome do Formulário / Tela]

Documentação dos campos e elementos do formulário de referência.

## Campos do Formulário

| Campo | Tipo de Dado / Componente | Obrigatoriedade | Descrição / Observações |
| :--- | :--- | :--- | :--- |
| **[Nome do Rótulo]** | [Tipo] | [Obrigatório/Opcional] | [Descrição breve] |

---

## Botões e Ações
- **[Nome Ação]**: [Descrição]
```

3. **Comunicação:**
   - Manter frases curtas e diretas.
   - Confirmar a criação do arquivo com o link correspondente.

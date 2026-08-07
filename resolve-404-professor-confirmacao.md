# Erro 404 — /professor/confirmacao

Diagnóstico do 404 ao acessar
`https://beneficiarios-andorinha.vercel.app/professor/confirmacao` estando
logado como `funcionario`. Levantado em 2026-08-07. Nada foi alterado no
código ao produzir este documento.

## Causa

A rota não existe. Não é auth, não é permissão, não é RLS.

Em `web/src/app/(dashboard)/professor/` existe **um único arquivo**:
`page.tsx`. Não há `confirmacao/page.tsx`. No App Router, um segmento de URL
sem `page.tsx` correspondente é 404 padrão do Next — o request nem chega a
executar código de professor.

Confirmado que nada intercepta antes:

- não existe `middleware.ts` no projeto
- não existe rota catch-all (`[...slug]`) nem `not-found.tsx`
- o único rewrite no `next.config.ts` é `/api/v1/:path*` → API

## Evidência

O commit `d9faa86` transformou a Área do Professor num hub de navegação com
quatro cards, mas criou só os links, não os destinos. Em
`web/src/components/professor/DashboardProfessorHub.tsx`:

| card | href | destino existe? |
|---|---|---|
| Bater Ponto | `/funcionarios/${professor.id}/ponto` | sim |
| Verificação / Confirmação | `/professor/confirmacao` | **não** |
| Dar Presença | `/professor/chamada` | **não** |
| Agenda de Turmas | `/professor/agenda` | **não** |

Três dos quatro cards levam a 404. O de ponto funciona porque aponta para
uma rota que já existia.

## O detalhe que fecha o quadro

A tela de confirmação **está implementada**, em
`web/src/components/professor/PortalProfessor.tsx` (386 linhas, com o passo
"3. Confirmação de Serviço", `handleEnviarConfirmacao`, upload de relatório
fotográfico). Só que nenhum arquivo importa esse componente — busca por
`PortalProfessor` em todo `web/src` retorna apenas a própria definição.

Quando o commit `d9faa86` trocou o portal em abas pelo hub de cards, o
`PortalProfessor` ficou órfão e o conteúdo dele perdeu a rota que o
renderizava.

## Solução proposta

Criar `web/src/app/(dashboard)/professor/confirmacao/page.tsx` como server
component, no mesmo padrão do `professor/page.tsx` atual: buscar o
funcionário e os dados que o componente precisa, e renderizar a parte de
confirmação do `PortalProfessor` — extraindo aquele passo para um
`ConfirmacaoServicoForm.tsx` próprio, já que o `PortalProfessor` inteiro é um
wizard de três etapas e só a etapa 3 interessa aqui.

Mesmo tratamento para `/professor/chamada` e `/professor/agenda`, senão os
outros dois cards continuam quebrados.

Alternativa mais barata, se a ideia for entregar em um passo: apontar os
hrefs do hub para rotas que já existem (`chamada` → `/turmas/[id]/presenca`,
`agenda` → `/agenda`) em vez de criar três telas novas.

## Dois pontos que aparecem logo depois

**Professor logado não é resolvido.** O `professor/page.tsx` faz
`funcionarios.data.find(f => f.professorResponsavel) || funcionarios.data[0]`
— pega o primeiro professor da lista, qualquer um. A rota nova herdaria o
mesmo problema. O certo é resolver pelo `entidade_id` do usuário autenticado,
que é exatamente o campo que está `null` para `professor@andorinha.local`
(ver `resolve-login-prof.md`).

**Confirmação não persiste.** O `PortalProfessor` grava só em estado local
com `toast.success`. A tela vai abrir e parecer funcionar, mas nada é salvo.

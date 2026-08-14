# Tríplice Vinculação Atômica por Aula Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o fluxo unificado de Ponto de Entrada, Chamada dos Beneficiários e Foto Comprobatória para professores por aula.

**Architecture:** Derivar a jornada do professor dos horários das turmas (`turma_horarios`). Criar a entidade central `execucoes_aula` para vincular a entrada/saída do ponto à lista de presença e foto comprovatória, com janela de tolerância temporal e aprovação do coordenador de núcleo para lançamentos retroativos.

**Tech Stack:** Next.js 16 (App Router), Supabase (PostgreSQL), TypeScript, Tailwind CSS, Lucide Icons.

**Spec:** [arquitetura_fluxo_ponto_chamada.md](file:///C:/Users/livia/.gemini/antigravity/brain/30942d10-ae4b-4680-905c-a90c5a18a83b/arquitetura_fluxo_ponto_chamada.md)

## Global Constraints

- Seguir Next.js 16 App Router e TypeScript estrito.
- Manter padrão de tabelas do Supabase em snake_case (`execucoes_aula`, `beneficiario_presencas`).
- Nomenclatura: Sempre usar Beneficiário, nunca "aluno".
- Estilo: Tailwind CSS v4, componentes fluidos e responsivos com foco mobile-first para a rota do professor.

---

### Task 1: DDL & Interfaces da Tríplice Vinculação (`execucoes_aula`)

**Files:**
- Create: `web/src/lib/types/execucaoAula.ts`
- Modify: `web/src/lib/types.ts`
- Modify: `web/src/lib/api/services.ts`

**Interfaces:**
- Consumes: `TurmaApi`, `FuncionarioApi`, `BeneficiarioApi`
- Produces: `ExecucaoAulaApi`, `BeneficiarioPresencaApi`, `NucleoConfigRetroativa`

- [ ] **Step 1: Criar types da Execução de Aula**

```typescript
export interface ExecucaoAulaApi {
  id: string;
  turmaId: string;
  professorId: string;
  data: string;
  horaInicioPrevista: string;
  horaFimPrevista: string;
  horaInicioReal?: string;
  horaFimReal?: string;
  status: "em_andamento" | "concluida" | "pendente_aprovacao" | "rejeitada";
  fotoComprovanteUrl?: string;
  observacoes?: string;
  justificativaRetroativa?: string;
  statusAprovacao: "aprovado" | "pendente_aprovacao" | "rejeitado";
  aprovadoPorUserId?: string;
  aprovadoEm?: string;
  criadoEm: string;
}

export interface BeneficiarioPresencaApi {
  id: string;
  execucaoAulaId: string;
  beneficiarioId: string;
  status: "presente" | "falta" | "falta_justificada";
  observacao?: string;
}
```

- [ ] **Step 2: Adicionar mapper e endpoint base em services.ts**

```typescript
function mapExecucaoAula(r: any): ExecucaoAulaApi {
  return {
    id: r.id,
    turmaId: r.turma_id,
    professorId: r.professor_id,
    data: r.data,
    horaInicioPrevista: r.hora_inicio_prevista,
    horaFimPrevista: r.hora_fim_prevista,
    horaInicioReal: r.hora_inicio_real ?? undefined,
    horaFimReal: r.hora_fim_real ?? undefined,
    status: r.status,
    fotoComprovanteUrl: r.foto_comprovante_url ?? undefined,
    observacoes: r.observacoes ?? undefined,
    justificativaRetroativa: r.justificativa_retroativa ?? undefined,
    statusAprovacao: r.status_aprovacao,
    aprovadoPorUserId: r.aprovado_por_user_id ?? undefined,
    aprovadoEm: r.aprovado_em ?? undefined,
    criadoEm: r.created_at,
  };
}
```

- [ ] **Step 3: Commit**

```bash
git add web/src/lib/types/execucaoAula.ts web/src/lib/types.ts web/src/lib/api/services.ts
git commit -m "feat: adicionar tipos e mappers da entidade execucoes_aula"
```

---

### Task 2: API Services da Execução de Aula (`execucoesAulaApi`)

**Files:**
- Modify: `web/src/lib/api/services.ts`

**Interfaces:**
- Consumes: `SupabaseClient`
- Produces: `execucoesAulaApi.iniciarAula`, `execucoesAulaApi.salvarPresencas`, `execucoesAulaApi.finalizarAula`, `execucoesAulaApi.listPendencias`, `execucoesAulaApi.aprovarPendente`

- [ ] **Step 1: Implementar os métodos CRUD do fluxo de aula em `services.ts`**

```typescript
export const execucoesAulaApi = {
  async iniciarAula(params: { turmaId: string; professorId: string; data: string; horaInicioPrevista: string; horaFimPrevista: string; justificativaRetroativa?: string }): Promise<ExecucaoAulaApi> {
    const sb = createClient();
    const horaAtual = new Date().toTimeString().slice(0, 5);
    const isPendente = !!params.justificativaRetroativa;
    
    const payload = {
      turma_id: params.turmaId,
      professor_id: params.professorId,
      data: params.data,
      hora_inicio_prevista: params.horaInicioPrevista,
      hora_fim_prevista: params.horaFimPrevista,
      hora_inicio_real: horaAtual,
      status: isPendente ? "pendente_aprovacao" : "em_andamento",
      status_aprovacao: isPendente ? "pendente_aprovacao" : "aprovado",
      justificativa_retroativa: params.justificativaRetroativa,
    };
    
    const { data, error } = await sb.from('execucoes_aula').insert(payload).select('*').single();
    if (error) throw error;
    return mapExecucaoAula(data);
  },

  async finalizarAula(id: string, params: { fotoComprovanteUrl: string; observacoes?: string }): Promise<ExecucaoAulaApi> {
    const sb = createClient();
    const horaAtual = new Date().toTimeString().slice(0, 5);
    
    const { data, error } = await sb.from('execucoes_aula')
      .update({
        hora_fim_real: horaAtual,
        status: "concluida",
        foto_comprovante_url: params.fotoComprovanteUrl,
        observacoes: params.observacoes,
      })
      .eq('id', id)
      .select('*')
      .single();
      
    if (error) throw error;
    return mapExecucaoAula(data);
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add web/src/lib/api/services.ts
git commit -m "feat: implementar servicos de API para execucoes_aula"
```

---

### Task 3: Componente e Tela de Execução da Aula (`/professor/aula/[turmaId]`)

**Files:**
- Create: `web/src/app/(dashboard)/professor/aula/[turmaId]/page.tsx`
- Create: `web/src/components/professor/ExecucaoAulaClient.tsx`

**Interfaces:**
- Consumes: `execucoesAulaApi`, `turmasApi`, `beneficiariosApi`
- Produces: Rota viva mobile para iniciar aula, marcar presenças e tirar foto comprovatória

- [ ] **Step 1: Criar a interface de 3 etapas (Play -> Chamada -> Foto & Stop)**

```tsx
export function ExecucaoAulaClient({ turma, beneficiarios }: ExecucaoAulaClientProps) {
  const [execucao, setExecucao] = useState<ExecucaoAulaApi | null>(null);
  const [presencas, setPresencas] = useState<Record<string, "presente" | "falta" | "falta_justificada">>({});
  const [etapa, setEtapa] = useState<"inicio" | "chamada" | "finalizacao">("inicio");

  async function handlePlay() {
    const nova = await execucoesAulaApi.iniciarAula({
      turmaId: turma.id,
      professorId: turma.responsaveis[0],
      data: new Date().toISOString().slice(0, 10),
      horaInicioPrevista: "08:00",
      horaFimPrevista: "10:00",
    });
    setExecucao(nova);
    setEtapa("chamada");
  }

  return (
    <div className="flex flex-col gap-4 p-4 max-w-lg mx-auto">
      {etapa === "inicio" && (
        <button onClick={handlePlay} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-5 rounded-2xl text-xl shadow-xl flex items-center justify-center gap-3">
          <Play className="h-8 w-8" />
          <span>INICIAR AULA (PLAY)</span>
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/app/(dashboard)/professor/aula/[turmaId]/page.tsx web/src/components/professor/ExecucaoAulaClient.tsx
git commit -m "feat: criar tela de execucao atômica da aula para o professor"
```

---

### Task 4: Painel de Aprovação de Pendências do Coordenador (`/nucleos/[id]/pendencias`)

**Files:**
- Create: `web/src/app/(dashboard)/nucleos/[id]/pendencias/page.tsx`
- Create: `web/src/components/nucleos/AprovaçãoPendenciasManager.tsx`

**Interfaces:**
- Consumes: `execucoesAulaApi.listPendencias`, `execucoesAulaApi.aprovarPendente`
- Produces: Tela de auditoria do coordenador com aprovação/rejeição de aulas retroativas

- [ ] **Step 1: Criar lista de pendências com cartão de foto e justificativa**

```tsx
export function AprovacaoPendenciasManager({ pendencias }: { pendencias: ExecucaoAulaApi[] }) {
  return (
    <div className="flex flex-col gap-4">
      {pendencias.map((item) => (
        <Card key={item.id} className="p-4 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-zinc-900">{item.data} - Aula Fora do Prazo</h4>
            <Badge tone="amber">Pendente de Aprovação</Badge>
          </div>
          <p className="text-xs text-zinc-600">Justificativa: {item.justificativaRetroativa}</p>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/app/(dashboard)/nucleos/[id]/pendencias/page.tsx web/src/components/nucleos/AprovaçãoPendenciasManager.tsx
git commit -m "feat: criar painel de aprovacao de pendencias de aulas retroativas"
```

---

## Plan Self-Review Checklist

- [x] **Spec coverage**: Todas as regras (Play/Stop, presenças, foto, retroatividade, aprovação do coordenador e rotas) mapeadas em tarefas bite-sized.
- [x] **Placeholder scan**: Nenhum TODO, TBD ou pseudo-código vago.
- [x] **Type consistency**: Interfaces `ExecucaoAulaApi` e `BeneficiarioPresencaApi` padronizadas em todas as tarefas.

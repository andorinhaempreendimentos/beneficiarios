# Ações Bulk por Entidade — Análise e Recomendações

## 1. 📋 **Beneficiários** (`/beneficiarios`)

**Status disponíveis:** `pendente`, `ativo`, `inativo`

### Ações Recomendadas:

#### ✅ Alta Prioridade
- **Alterar Status em Lote** — mudar múltiplos beneficiários de `pendente` → `ativo` ou `ativo` → `inativo` de uma vez
  - Caso de uso: aprovar grupo de inscritos após análise documental
  - Caso de uso: desativar turma inteira que encerrou
- **Transferir para Outra Turma** — realocar grupo de beneficiários para turma diferente
  - Caso de uso: turma lotou, mover fila de espera para nova turma aberta
  - Caso de uso: professor saiu, redistribuir alunos
- **Enviar Comunicado** — notificar grupo selecionado via SMS/email
  - Caso de uso: avisar sobre evento especial, cancelamento de aula
- **Exportar (já existe)** — gerar Excel/PDF com dados dos selecionados

#### 🔵 Média Prioridade
- **Vincular a Nova Turma** (sem desvincular das atuais) — matricular grupo em atividade adicional
  - Caso de uso: inscrever todos da turma X em evento esportivo Y
- **Gerar Relatório de Grupo** — documento consolidado com dados do grupo (frequência, desempenho)
- **Imprimir Fichas** — gerar PDF com fichas individuais de cada selecionado (para arquivo físico)

#### ⚠️ Baixa Prioridade / Perigosa
- **Excluir em Lote** — mover múltiplos para lixeira
  - Requer confirmação forte (digitar "CONFIRMAR EXCLUSÃO")
  - Bloquear se algum tiver registros de presença

---

## 2. 📝 **Inscrições** (`/inscricoes`)

**Status disponíveis:** `pendente`, `reservada`, `aprovada`, `recusada`, `expirada`, `cancelada`

### Ações Recomendadas:

#### ✅ Alta Prioridade
- **Aprovar em Lote** — mudar múltiplas inscrições de `pendente` → `aprovada`
  - Caso de uso: análise documental aprovada, liberar grupo inteiro
- **Mover para Fila de Espera** — `pendente` → `reservada`
  - Caso de uso: turma lotou, colocar grupo em espera
- **Recusar em Lote** — `pendente` → `recusada` com motivo padrão
  - Caso de uso: inscrições fora do prazo, documentação incompleta
- **Cancelar em Lote** — `qualquer status` → `cancelada`
  - Caso de uso: turma cancelada, invalidar todas inscrições
- **Exportar (já existe)**

#### 🔵 Média Prioridade
- **Reabrir Inscrições** — `recusada`/`expirada` → `pendente` (dar segunda chance)
- **Enviar Email Padrão** — notificar grupo (ex: "documentação pendente", "aguarde contato")
- **Transferir para Outra Turma** — redirecionar inscrições para turma alternativa
  - Caso de uso: turma A lotou, oferecer turma B para lista de espera

---

## 3. 🏫 **Turmas** (`/turmas`)

### Ações Recomendadas:

#### ✅ Alta Prioridade
- **Duplicar Turmas** — criar cópias de turmas selecionadas (mesmo núcleo/atividade/horário, vagas zeradas)
  - Caso de uso: abrir novas turmas com configuração idêntica
- **Alterar Responsável/Professor** — trocar instrutor de múltiplas turmas de uma vez
  - Caso de uso: professor substituído, reatribuir todas turmas dele
- **Ajustar Vagas em Lote** — aumentar/diminuir vagas totais de múltiplas turmas
  - Exemplo: +5 vagas em todas turmas de futebol
- **Exportar (já existe)**

#### 🔵 Média Prioridade
- **Encerrar Turmas** — marcar como encerradas (bloquear novas inscrições, manter histórico)
- **Gerar Relatório Consolidado** — relatório de ocupação, frequência média, evasão do grupo
- **Alterar Horário em Lote** — ajustar grade horária de múltiplas turmas
  - Caso de uso: núcleo mudou horário de funcionamento

#### ⚠️ Baixa Prioridade
- **Excluir em Lote** — apenas se turmas não tiverem alunos matriculados

---

## 4. 🏢 **Núcleos** (`/nucleos`)

### Ações Recomendadas:

#### ✅ Alta Prioridade
- **Ativar/Desativar em Lote** — mudar `emFuncionamento` de múltiplos núcleos
  - Caso de uso: férias escolares, suspender núcleos temporariamente
- **Alterar Disponibilidade Pré-Inscrição** — habilitar/desabilitar `disponivelPreInscricao`
  - Caso de uso: abrir período de matrículas para grupo de núcleos
- **Exportar (já existe)**

#### 🔵 Média Prioridade
- **Vincular a Organização** — transferir múltiplos núcleos para outra organização
  - Caso de uso: reestruturação administrativa
- **Gerar Mapa de Localização** — exportar KML/GeoJSON com coordenadas dos núcleos selecionados
- **Imprimir Placas de Identificação** — PDF com dados para placa física (nome, endereço, QR code)

---

## 5. 👥 **Funcionários** (`/funcionarios`)

**Status:** `contratado`, `voluntario`, `demitido`, `pendente`, `licenca_medica`, `licenca_maternidade`, `afastado_inss`

### Ações Recomendadas:

#### ✅ Alta Prioridade
- **Alterar Status em Lote** — exemplo: marcar grupo como `licenca_medica`
- **Realocar para Outro Núcleo** — transferir grupo de funcionários
  - Caso de uso: núcleo fechou, realocar equipe
- **Gerar Folha de Ponto Consolidada** — relatório de presença do grupo no período
- **Exportar (já existe)**

#### 🔵 Média Prioridade
- **Enviar Comunicado** — notificar grupo (reunião, treinamento)
- **Ajustar Jornada em Lote** — alterar horário de trabalho padrão de múltiplos funcionários
- **Gerar Contratos** — PDF com contrato padrão preenchido para cada selecionado

---

## 6. 🎯 **Atividades** (`/atividades`)

### Ações Recomendadas:

#### ✅ Alta Prioridade
- **Habilitar/Desabilitar Pré-Inscrição** — mudar `disponivelPreInscricao` em lote
  - Caso de uso: abrir matrículas apenas para atividades prioritárias
- **Duplicar Atividades** — criar cópias para replicar em outros núcleos
- **Exportar (já existe)**

#### 🔵 Média Prioridade
- **Ajustar Faixa Etária em Lote** — exemplo: aumentar idade máxima de todas atividades esportivas
- **Vincular a Múltiplos Núcleos** — disponibilizar atividades em núcleos adicionais

---

## 7. 🏗️ **Equipamentos** (`/equipamentos`)

**Conservação:** `novo`, `bom`, `regular`, `ruim`, `inservivel`

### Ações Recomendadas:

#### ✅ Alta Prioridade
- **Alterar Estado de Conservação** — atualizar múltiplos equipamentos
  - Caso de uso: após vistoria, marcar grupo como `regular` ou `ruim`
- **Transferir para Outro Núcleo** — realocar equipamentos
- **Baixar do Inventário** — marcar múltiplos como `inservivel` e remover do ativo
- **Exportar (já existe)**

#### 🔵 Média Prioridade
- **Gerar Etiquetas de Patrimônio** — PDF com código de barras para cada item
- **Agendar Manutenção** — criar registro de manutenção preventiva para grupo
- **Imprimir Termo de Responsabilidade** — documento de empréstimo/cessão

---

## 8. 🏛️ **Organizações** (`/organizacoes`)

### Ações Recomendadas:

#### ✅ Alta Prioridade
- **Ativar/Desativar em Lote** — mudar status de múltiplas organizações
- **Exportar (já existe)**

#### 🔵 Média Prioridade
- **Gerar Relatório Consolidado** — desempenho de múltiplas organizações (núcleos, beneficiários)
- **Vincular a Objeto** — associar grupo de organizações a novo projeto/evento

---

## 9. 🎯 **Objetos** (`/objetos`)

**Status:** `ativo`, `encerrado`, `planejado`

### Ações Recomendadas:

#### ✅ Alta Prioridade
- **Alterar Status em Lote** — `planejado` → `ativo` ao iniciar projeto
- **Exportar (já existe)**

#### 🔵 Média Prioridade
- **Gerar Relatório de Portfólio** — visão consolidada de múltiplos projetos
- **Clonar Objetos** — duplicar estrutura de projeto (organizações + núcleos) para novo termo

---

## 10. 👤 **Usuários** (`/usuarios`)

### Ações Recomendadas:

#### ✅ Alta Prioridade
- **Alterar Perfil em Lote** — mudar múltiplos usuários de perfil
  - Caso de uso: promover grupo de instrutores a gestores
- **Ativar/Desativar em Lote** — suspender ou reativar contas
- **Redefinir Senha** — forçar troca de senha no próximo login
- **Exportar (já existe)**

#### 🔵 Média Prioridade
- **Enviar Email de Boas-Vindas** — reenviar credenciais para grupo
- **Gerar Relatório de Acesso** — último login, atividade recente

---

## 🎯 Resumo de Prioridades Globais

### **Implementar Primeiro (máximo impacto):**
1. **Alterar Status em Lote** — beneficiários, inscrições, funcionários
2. **Transferir/Realocar** — beneficiários entre turmas, funcionários entre núcleos, equipamentos
3. **Aprovar/Recusar Inscrições em Lote**
4. **Enviar Comunicado** — beneficiários, funcionários
5. **Duplicar** — turmas, atividades

### **Segundo Momento:**
- Relatórios consolidados de grupo
- Impressão de documentos em lote (fichas, contratos, etiquetas)
- Vincular/desvincular entidades em lote

### **Ações Perigosas (requerem confirmação extra):**
- Excluir em lote
- Cancelar inscrições aprovadas
- Baixar equipamentos do inventário
- Desativar núcleos com turmas ativas

---

## 💡 Padrão de Interface Recomendado

```tsx
<BulkActionsBar selectedCount={X} totalCount={Y}>
  {/* Ação principal (destaque) */}
  <Button variant="primary">
    <Icon /> Ação Principal
  </Button>
  
  {/* Ações secundárias */}
  <Button variant="secondary">
    <Icon /> Ação 2
  </Button>
  
  {/* Dropdown com ações avançadas */}
  <DropdownMenu>
    <DropdownItem>Ação 3</DropdownItem>
    <DropdownItem danger>Ação Perigosa</DropdownItem>
  </DropdownMenu>
  
  {/* Exportar sempre visível */}
  <Button variant="ghost">
    <Download /> Exportar
  </Button>
</BulkActionsBar>
```

### Modal de Confirmação para Ações Destrutivas:
- Mostrar lista de IDs/nomes afetados
- Forçar checkbox "Entendo que esta ação não pode ser desfeita"
- Para exclusão: campo de texto "Digite CONFIRMAR para prosseguir"

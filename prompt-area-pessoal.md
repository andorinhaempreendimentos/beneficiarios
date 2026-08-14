# Prompt: Refatoração Completa do Módulo de Pessoal (Recursos Humanos)

## Contexto do Sistema

Sistema de gestão de beneficiários de projetos esportivos fomentados pelo governo. Controla execução de atividades, recursos humanos (folha de ponto), equipamentos e relatórios.

**Stack**: NestJS + MySQL + Next.js 16 + Tailwind v4 + PWA + JWT/RBAC + Hostinger Business Web Hosting

**Hierarquia de dados**:
```
OBJETO (Projeto/Evento)
  └── Organização
        └── Local/Núcleo
              └── Turma
                    └── Atividade
                          └── Instrutor/Professor
                                └── Beneficiário
```

**Perfis de usuário**:
- Admin: acesso total
- Gestor: permissões configuráveis por tabela
- Funcionário/Instrutor: bater ponto próprio, lista presença beneficiários, comprovar atividades com foto
- Beneficiário: não acessa painel admin, apenas link público de inscrição

---

## Estado Atual do Módulo Ponto/Pessoal

### Entidades Existentes

**`funcionarios` (Funcionario)**
- `matricula` (unique, 20 chars)
- `nomeCompleto` (300 chars)
- `dataNascimento` (date, nullable)
- `cpf` (14 chars, nullable)
- `celular` (20 chars, nullable)
- `email` (200 chars, nullable)
- `cargo` (enum: professor, coordenador, administrativo, outro)
- `fotoUrl` (text, nullable) — URL relativa no R2
- Relações: `jornada[]`, `turmasResponsavel[]`, `registrosPonto[]`
- SoftDelete habilitado

**`funcionario_jornada` (FuncionarioJornada)**
- 7 linhas por funcionário (1 por dia da semana)
- `funcionarioId` (FK)
- `diaSemana` (tinyint: 0=domingo até 6=sábado)
- `horaEntrada` (time, nullable)
- `horaSaida` (time, nullable)
- `ativo` (boolean, default true) — se false, funcionário não trabalha neste dia
- Unique: `[funcionarioId, diaSemana]`

**`registros_ponto` (RegistroPonto)**
- `funcionarioId` (FK)
- `data` (date)
- `tipo` (enum: entrada, saida, entrada_intervalo, saida_intervalo)
- `hora` (time)
- `tokenQrHash` (varchar 64, nullable) — hash SHA256 do token QR de curta duração
- `observacao` (text, nullable)
- Unique: `[funcionarioId, data, tipo]` — impede duplicar tipo no mesmo dia
- Constraint RESTRICT em FK

### Lógica de Negócio Atual

**PontoService**:
- `findAll(filter)`: filtra por funcionarioId, data, tipo; retorna paginado, ordena DESC data+hora
- `gerarQr(turmaId)`: gera token aleatório 24 bytes hex, TTL 15min, armazena hash SHA256 em Map in-memory
- `registrarViaPonto(dto, token)`: valida hash, pega data/hora atual, checa conflito (mesmo tipo+dia), salva com tokenQrHash
- `registrarManual(dto)`: igual anterior mas sem validar token QR

**Regras**:
1. Apenas 1 registro por tipo/dia/funcionário (lança ConflictException se duplicar)
2. QR token expira em 15min, armazenado em Map volátil (perde na reinicialização)
3. Sem validação cruzada: não verifica se hora batida está dentro da jornada esperada
4. Jornada: esperado 7 registros por funcionário, mas não há validação forçada

---

## Formulário Atual (Referência)

Baseado em `informacoes/formulario_funcionario.md`:

| Campo | Tipo | Obrigatoriedade | Descrição |
|-------|------|-----------------|-----------|
| Nome completo | text | Obrigatório | Nome completo |
| Professor responsável de turma | switch | Opcional | Define se pode ser responsável por turmas |
| Foto | file | Opcional | Upload foto perfil |
| Documento CPF/CNPJ | text+mask | Opcional | CPF/CNPJ com máscara |
| Data de Nascimento | date | Opcional | Data nascimento |
| Status | select2 | Obrigatório | contratado, voluntário, demitido, pendente, Licença Médica, Licença Maternidade, Afastado INSS |
| Data de admissão | date | Obrigatório | Data admissão no projeto |
| Data de demissão | date | Opcional | Data demissão (se aplicável) |
| Função | select2 | Obrigatório | Lista ampla: Agente comunitário, Instrutor, Coordenador, Monitor, etc. |
| Remuneração | text | Opcional | Valor remuneração/salário |
| Núcleo | select2 | Opcional | Núcleo vinculado ou "Sem núcleo definido" |
| Alocado em | select2 | Obrigatório | Administração, Múlti. núcleos, Nenhum, Serviços gerais, Núcleo específico |
| Observação | textarea | Opcional | Observações adicionais |
| Conselho | select2 | Condicional | Se Fisioterapeuta/Técnico Enfermagem: CREFITO, COREN |
| Registro | text | Condicional | Número registro conselho classe |
| Conta de acesso | select2 | Opcional | Vínculo com conta usuário sistema |
| **Entrada Padrão** | time | Opcional | Horário padrão entrada para aplicação em lote |
| **Saída Padrão** | time | Opcional | Horário padrão saída para aplicação em lote |
| **Jornada de Trabalho (Tabela Semanal)** | checkbox/time | Opcional | Config por dia: trabalha Sim/Não, hora entrada, hora saída |

**Botões**:
- **Aplicar aos dias ativos**: aplica entrada/saída padrão a todos dias marcados como "Sim"
- **Salvar**: atualiza ou cria registro

---

## Listagem Atual (Referência)

Baseado em `informacoes/listagem_funcionarios.md`:

**Filtros**:
- Buscar: texto (Nome ou CPF)
- Alocado em: select (Todos, Administração, Múlti. núcleos, ou núcleo específico)
- Função: select (Todas, Articulador social, Coordenador núcleo, Coordenador projeto, Coordenador setor, Instrutor, Monitor)
- Status: select (Todos, Contratado, Demitido)
- Data admissão: período (de/até)

**Cards visão geral**:
- Admitidos (destaque azul)
- Desligados (destaque vermelho)

**Tabela**:
- Colunas: Matrícula, Nome, Status, CPF, Função, Data Admissão, Local Alocado, Ações
- Paginação: 20 registros/página
- Ações: Detalhes (lupa), Editar (lápis), Remover (lixeira)

---

## Problemas e Gaps Identificados

### 1. **Modelo de dados desalinhado com formulário**
- Formulário pede: Status, Data admissão, Data demissão, Função, Remuneração, Núcleo, Alocado em, Observação, Conselho, Registro, Conta acesso
- Entity atual (`funcionarios`) tem apenas: matricula, nomeCompleto, dataNascimento, cpf, celular, email, cargo, fotoUrl
- **Faltam campos críticos**: status, dataAdmissao, dataDemissao, funcao, remuneracao, nucleoId, alocadoEm, observacao, conselho, registro, contaAcessoId

### 2. **Campo `cargo` não reflete a realidade**
- Enum `CargoFuncionario` (professor, coordenador, administrativo, outro) é genérico demais
- Formulário exige lista ampla de funções (Agente comunitário, Instrutor, Coordenador, Monitor, etc.)
- **Solução**: criar tabela `funcoes` normalizadas, FK em `funcionarios.funcaoId`

### 3. **Status não está modelado**
- Formulário lista 7 status diferentes: contratado, voluntário, demitido, pendente, Licença Médica, Licença Maternidade, Afastado INSS
- Não há campo `status` na entity
- SoftDelete (`deletedAt`) não substitui status granular

### 4. **Alocação não está modelada**
- Campo "Alocado em" é obrigatório mas não existe na entity
- Opções: Administração, Múlti. núcleos, Nenhum, Serviços gerais, Núcleo específico
- **Proposta**: enum `TipoAlocacao` + FK nullable `nucleoAlocadoId`

### 5. **QR token store volátil**
- `qrStore` é Map in-memory — perde tokens na reinicialização
- Para cluster/horizontal scale não funciona
- **Solução**: persistir em Redis ou criar entity `QrTokens` com TTL automático via job

### 6. **Sem validação horário jornada vs ponto registrado**
- Sistema permite bater ponto fora do horário esperado sem alerta
- Não detecta atrasos, saídas antecipadas, horas extras
- Não calcula carga horária trabalhada vs esperada

### 7. **Sem controle de turnos/escalas**
- Funcionário pode trabalhar turno manhã, tarde, noite, ou escala personalizada
- Jornada atual assume horário único por dia, mas pode haver:
  - Turno quebrado (manhã 8-12h + tarde 14-18h no mesmo dia)
  - Escala 12x36 (trabalha dia sim, dia não)
  - Banco de horas / compensação

### 8. **Relatórios de ponto inexistentes**
- Não há endpoint/service para gerar folha de ponto mensal
- Não há cálculo de: horas trabalhadas, atrasos, faltas, horas extras
- Não há exportação PDF/Excel

### 9. **Professor responsável por turma**
- Formulário tem switch "Professor responsável de turma", mas não há campo correspondente
- Relação `turmasResponsavel` existe mas sem controle de capacidade
- Não valida se funcionário pode ser responsável por múltiplas turmas simultaneamente

### 10. **Conselho de classe**
- Campos condicionais (Conselho, Registro) se função for Fisioterapeuta/Técnico Enfermagem
- Não modelado na entity

### 11. **Vínculo com conta de usuário**
- Campo "Conta de acesso" opcional para vincular funcionário a user do sistema
- Não há FK `userId` na entity atual
- Necessário para login funcionário/instrutor

---

## Requisitos da Refatoração

### A. **Expandir entidade `funcionarios`**

Adicionar campos:
- `status` (enum: contratado, voluntario, demitido, pendente, licenca_medica, licenca_maternidade, afastado_inss)
- `dataAdmissao` (date, obrigatório)
- `dataDemissao` (date, nullable)
- `funcaoId` (FK para `funcoes`, obrigatório)
- `remuneracao` (decimal(10,2), nullable)
- `tipoAlocacao` (enum: administracao, multi_nucleos, nenhum, servicos_gerais, nucleo_especifico)
- `nucleoAlocadoId` (FK para `nucleos`, nullable — obrigatório se tipoAlocacao = nucleo_especifico)
- `observacao` (text, nullable)
- `conselho` (varchar 50, nullable)
- `registroConselho` (varchar 50, nullable)
- `userId` (FK para `users`, nullable) — conta de acesso
- `podeSerResponsavelTurma` (boolean, default false)

### B. **Criar tabela `funcoes`**

```sql
CREATE TABLE funcoes (
  id VARCHAR(36) PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  descricao TEXT,
  exigeConselho BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

Seed inicial: Agente comunitário, Instrutor, Coordenador de núcleo, Coordenador de projeto, Coordenador de setor, Monitor, Fisioterapeuta, Técnico de Enfermagem, Auxiliar Operacional, etc.

### C. **Criar tabela `funcionario_turnos`**

Para suportar jornadas complexas (turno quebrado, múltiplos slots no mesmo dia):

```sql
CREATE TABLE funcionario_turnos (
  id VARCHAR(36) PRIMARY KEY,
  funcionarioId VARCHAR(36) NOT NULL,
  diaSemana TINYINT UNSIGNED NOT NULL,
  horaInicio TIME NOT NULL,
  horaFim TIME NOT NULL,
  tipoTurno ENUM('manha', 'tarde', 'noite', 'integral', 'personalizado') DEFAULT 'personalizado',
  ativo BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (funcionarioId) REFERENCES funcionarios(id) ON DELETE CASCADE,
  INDEX idx_funcionario_dia (funcionarioId, diaSemana)
);
```

**Lógica**:
- Substituir `funcionario_jornada` (1 linha/dia) por `funcionario_turnos` (múltiplas linhas/dia)
- Permite turno quebrado: segunda 08:00-12:00 + segunda 14:00-18:00 (2 linhas)
- Se dia não tiver linha ativa, funcionário não trabalha naquele dia

### D. **Persistir QR tokens (escolher uma opção)**

**Opção 1: Redis** (recomendado para scale horizontal)
- Instalar `@nestjs/redis` + `ioredis`
- Salvar `SET qr:{turmaId} {hash} EX 900` (TTL 15min automático)

**Opção 2: Entity + Job de limpeza** (se Redis não disponível)
```sql
CREATE TABLE qr_tokens (
  turmaId VARCHAR(36) PRIMARY KEY,
  hash VARCHAR(64) NOT NULL,
  expiraEm TIMESTAMP NOT NULL,
  INDEX idx_expiracao (expiraEm)
);
```
- Job a cada 5min: `DELETE FROM qr_tokens WHERE expiraEm < NOW()`

### E. **Validação horário ponto vs jornada**

Ao registrar ponto, `PontoService` deve:
1. Buscar turnos ativos do funcionário no dia da semana atual
2. Se não houver turno ativo, rejeitar: "Você não tem jornada configurada para hoje"
3. Se tipo = `entrada`:
   - Checar se hora batida está ≤ 15min após `horaInicio` do turno → OK
   - Se > 15min → flag `atrasado: true`, salvar observacao automática "Atraso de Xmin"
4. Se tipo = `saida`:
   - Checar se hora batida está ≥ `horaFim` do turno → OK
   - Se < horaFim → flag `saidaAntecipada: true`, salvar observacao automática "Saída antecipada Xmin"
5. Adicionar campos em `registros_ponto`:
   - `atrasado` (boolean, default false)
   - `saidaAntecipada` (boolean, default false)
   - `horasExtras` (decimal(4,2), nullable) — calculado se saída > horaFim turno + tolerância

### F. **Cálculo de folha de ponto**

Criar `PontoService.calcularFolhaMensal(funcionarioId, mes, ano)`:
- Retorna objeto com:
  - `diasTrabalhados`: contagem de dias com entrada+saída
  - `totalHorasTrabalhadas`: soma (saída - entrada) - (saida_intervalo - entrada_intervalo)
  - `totalHorasEsperadas`: soma das jornadas configuradas para os dias trabalhados
  - `atrasos`: array de registros com flag `atrasado: true`
  - `saidasAntecipadas`: array de registros com flag `saidaAntecipada: true`
  - `horasExtras`: soma de `horasExtras`
  - `faltas`: dias úteis (com jornada) sem registro de ponto

### G. **Endpoints novos**

**FuncionariosController**:
- `POST /funcionarios/:id/turnos` — adicionar turno
- `PUT /funcionarios/:id/turnos/:turnoId` — editar turno
- `DELETE /funcionarios/:id/turnos/:turnoId` — remover turno
- `GET /funcionarios/:id/folha-ponto?mes=X&ano=Y` — retorna folha mensal calculada

**PontoController**:
- `GET /ponto/relatorio?funcionarioId=X&mes=Y&ano=Z` — exportar PDF folha de ponto
- `GET /ponto/relatorio/excel?funcionarioId=X&mes=Y&ano=Z` — exportar Excel

**FuncoesController** (novo):
- CRUD completo de funções
- `GET /funcoes?exigeConselho=true` — listar funções que exigem conselho

### H. **Frontend: adaptar formulário**

- Trocar campo `cargo` por select `funcaoId` (busca `/funcoes`)
- Adicionar campos: status, dataAdmissao, dataDemissao, remuneracao, tipoAlocacao, nucleoAlocadoId, observacao
- Se `funcao.exigeConselho === true`, mostrar campos condicionais: conselho, registroConselho
- Switch "Professor responsável de turma" → `podeSerResponsavelTurma`
- Select "Conta de acesso" → `userId` (busca `/users?perfil=funcionario`)

**Jornada**: trocar tabela única entrada/saída por lista de turnos:
- Botão "Adicionar turno" para cada dia
- Cada linha: diaSemana, horaInicio, horaFim, tipoTurno, ativo
- Permite múltiplos turnos no mesmo dia
- Manter "Entrada Padrão" + "Saída Padrão" + "Aplicar aos dias ativos" para conveniência (cria 1 turno/dia automaticamente)

### I. **Frontend: tela de ponto do funcionário**

Rota: `/funcionarios/:id/ponto`

Exibir:
- Filtros: mês/ano
- Cards: Total horas trabalhadas, Horas esperadas, Atrasos, Horas extras
- Tabela: Data, Dia semana, Entrada, Saída intervalo, Entrada intervalo, Saída, Total dia, Status (OK / Atrasado / Saída antecipada)
- Botões: Exportar PDF, Exportar Excel

### J. **Migration plan**

1. Criar tabela `funcoes` + seed
2. Adicionar colunas em `funcionarios` (permitir NULL temporariamente para não quebrar)
3. Criar tabela `funcionario_turnos`
4. Migrar dados `funcionario_jornada` → `funcionario_turnos` (1 turno/dia se `ativo=true` e `horaEntrada/horaFim` não null)
5. Adicionar colunas em `registros_ponto`: `atrasado`, `saidaAntecipada`, `horasExtras`
6. Criar tabela `qr_tokens` (se não usar Redis)
7. Ajustar constraints: tornar `funcaoId`, `dataAdmissao` obrigatórios após popular dados existentes

---

## Casos de uso a cobrir

1. **Cadastrar funcionário com jornada padrão**: admin cria funcionário, define entrada/saída padrão, clica "Aplicar aos dias ativos" → sistema cria 5 turnos (seg-sex) automaticamente
2. **Cadastrar funcionário com jornada quebrada**: admin adiciona manualmente turnos: segunda 08-12h + segunda 14-18h
3. **Funcionário bate ponto via QR**: instrutor/funcionário escaneia QR gerado pelo sistema, registra entrada, sistema valida token + jornada, salva ponto com flag se atrasado
4. **Admin registra ponto manual**: admin força registro de ponto para funcionário que esqueceu de bater, sem token QR
5. **Gerar folha de ponto mensal**: admin acessa `/funcionarios/:id/ponto`, filtra mês/ano, vê resumo + tabela detalhada, exporta PDF/Excel
6. **Gestor filtra funcionários por função**: gestor acessa listagem, filtra "Instrutor", vê apenas funcionários com funcaoId correspondente
7. **Funcionário com conselho de classe**: admin cadastra Fisioterapeuta, formulário exibe automaticamente campos Conselho + Registro
8. **Funcionário demitido**: admin altera status para "demitido", define dataDemissao, sistema continua exibindo na listagem mas com status visual diferente (não faz softDelete)
9. **Validar alocação em núcleo**: admin seleciona tipoAlocacao = "nucleo_especifico", campo nucleoAlocadoId torna-se obrigatório

---

## Critérios de sucesso

- [ ] Migration executada sem perda de dados
- [ ] Formulário funcionário reflete todos campos do modelo atualizado
- [ ] Jornada suporta múltiplos turnos por dia
- [ ] QR tokens persistem em Redis ou DB (não volátil)
- [ ] Registro de ponto valida horário vs jornada, calcula atrasos/extras
- [ ] Folha de ponto mensal calcula corretamente horas trabalhadas, atrasos, faltas
- [ ] Exportação PDF/Excel da folha de ponto funciona
- [ ] CRUD de funções implementado
- [ ] Frontend adapta campos condicionais (conselho se função exigir)
- [ ] Testes unitários cobrem cálculo de folha de ponto e validação de jornada
- [ ] Documentação atualizada (README, Swagger)

---

## Entrega esperada

Implementar refatoração completa seguindo requisitos A-J, mantendo compatibilidade com restante do sistema. Priorizar:
1. Integridade dados (migration segura)
2. Validações robustas (horário, alocação, conselho)
3. Performance (índices, queries otimizadas)
4. Usabilidade frontend (campos condicionais, aplicação em lote)
5. Relatórios precisos (cálculo correto de horas)

Entregar código testado, com migration, seeds, DTOs atualizados, controllers/services completos, e frontend ajustado.

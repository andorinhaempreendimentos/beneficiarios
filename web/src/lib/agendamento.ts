/**
 * Motor de Agendamento, Projeção Temporal e Prevenção de Conflitos
 *
 * Responsável pelo cálculo puro de datas de ocorrência (dia único, semanal, mensal)
 * com ajuste de fins de semana e feriados nacionais, além da validação preventiva
 * de choques físicos no núcleo e choques de escala do instrutor.
 */

export type TipoRecorrencia = "semanal" | "mensal_dia_fixo" | "mensal_dia_semana" | "pontual";
export type AjusteFimDeSemana = "manter" | "proximo_util" | "anterior_util";

export interface RegraBlocoHorario {
  id?: string;
  grupoId?: string;
  grupoNome?: string;
  nucleoId?: string;
  nucleoNome?: string;
  responsavelId?: string;
  responsavelNome?: string;
  atividadeId?: string;
  atividadeNome?: string;
  horaInicio: string; // formato "HH:mm" ou "HH:mm:ss"
  horaFim: string; // formato "HH:mm" ou "HH:mm:ss"
  tipoRecorrencia: TipoRecorrencia;
  diaSemana?: number | null; // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  diaMes?: number | null; // 1 a 31 (para mensal_dia_fixo)
  ordemSemanaMes?: number | null; // 1, 2, 3, 4, -1 (para mensal_dia_semana, -1 = última)
  ajusteFimDeSemana?: AjusteFimDeSemana | null;
  dataEspecifica?: string | null; // YYYY-MM-DD (para pontual)
  gruposAdicionaisIds?: string[] | null;
}

export interface DataSessaoProjetada {
  data: string; // "YYYY-MM-DD"
  diaSemana: number; // 0..6
  diaSemanaExtenso: string;
  horaInicio: string;
  horaFim: string;
  duracaoMinutos: number;
  blocoId?: string;
  grupoId?: string;
  responsavelId?: string;
  nucleoId?: string;
  ajustadaPorFimDeSemana: boolean;
  dataOriginal?: string;
}

export type TipoConflito = "choque_instrutor" | "choque_espaco_nucleo";

export interface ConflitoAgendamento {
  tipo: TipoConflito;
  titulo: string;
  mensagem: string;
  blocoA: RegraBlocoHorario;
  blocoB: RegraBlocoHorario;
  dataOuDia: string;
  horaInicio: string;
  horaFim: string;
}

const DIAS_SEMANA_EXTENSO = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

// ==========================================
// 1. UTILITÁRIOS DE FERIADOS E DIAS ÚTEIS
// ==========================================

/**
 * Calcula a data do Domingo de Páscoa (Algoritmo de Meeus/Jones/Butcher)
 */
export function calcularDomingoDePascoa(ano: number): Date {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(ano, mes - 1, dia);
}

/**
 * Retorna os feriados nacionais brasileiros para o ano especificado
 */
export function getFeriadosNacionais(ano: number): Set<string> {
  const pad = (n: number) => String(n).padStart(2, "0");
  const feriados = new Set<string>([
    `${ano}-01-01`, // Confraternização Universal
    `${ano}-04-21`, // Tiradentes
    `${ano}-05-01`, // Dia do Trabalho
    `${ano}-09-07`, // Independência do Brasil
    `${ano}-10-12`, // Nossa Senhora Aparecida
    `${ano}-11-02`, // Finados
    `${ano}-11-15`, // Proclamação da República
    `${ano}-11-20`, // Dia Nacional de Zumbi e da Consciência Negra (Lei 14.759/2023)
    `${ano}-12-25`, // Natal
  ]);

  // Feriados móveis derivados da Páscoa
  const pascoa = calcularDomingoDePascoa(ano);

  // Carnaval (Terça-feira, 47 dias antes da Páscoa)
  const carnaval = new Date(pascoa);
  carnaval.setDate(pascoa.getDate() - 47);
  feriados.add(`${ano}-${pad(carnaval.getMonth() + 1)}-${pad(carnaval.getDate())}`);

  // Sexta-feira Santa (2 dias antes da Páscoa)
  const sextaSanta = new Date(pascoa);
  sextaSanta.setDate(pascoa.getDate() - 2);
  feriados.add(`${ano}-${pad(sextaSanta.getMonth() + 1)}-${pad(sextaSanta.getDate())}`);

  // Corpus Christi (60 dias após a Páscoa)
  const corpusChristi = new Date(pascoa);
  corpusChristi.setDate(pascoa.getDate() + 60);
  feriados.add(`${ano}-${pad(corpusChristi.getMonth() + 1)}-${pad(corpusChristi.getDate())}`);

  return feriados;
}

export function isFimDeSemana(data: Date): boolean {
  const dia = data.getDay();
  return dia === 0 || dia === 6; // 0 = Domingo, 6 = Sábado
}

export function isFeriadoNacional(data: Date): boolean {
  const ano = data.getFullYear();
  const pad = (n: number) => String(n).padStart(2, "0");
  const dataStr = `${ano}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}`;
  const feriados = getFeriadosNacionais(ano);
  return feriados.has(dataStr);
}

export function isDiaUtil(data: Date): boolean {
  return !isFimDeSemana(data) && !isFeriadoNacional(data);
}

/**
 * Ajusta uma data caso ela coincida com fim de semana ou feriado
 */
export function ajustarFimDeSemanaEFeriado(data: Date, ajuste: AjusteFimDeSemana = "manter"): Date {
  if (ajuste === "manter") return new Date(data);

  const novaData = new Date(data);

  if (ajuste === "proximo_util") {
    while (!isDiaUtil(novaData)) {
      novaData.setDate(novaData.getDate() + 1);
    }
    return novaData;
  }

  if (ajuste === "anterior_util") {
    while (!isDiaUtil(novaData)) {
      novaData.setDate(novaData.getDate() - 1);
    }
    return novaData;
  }

  return novaData;
}

// ==========================================
// 2. PARSING E CONVERSÃO DE TEMPO
// ==========================================

export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function calcularDuracaoMinutos(horaInicio: string, horaFim: string): number {
  const inicio = timeToMinutes(horaInicio);
  const fim = timeToMinutes(horaFim);
  return fim > inicio ? fim - inicio : 60;
}

export function horariosSobrepoem(
  inicioA: string,
  fimA: string,
  inicioB: string,
  fimB: string
): boolean {
  const aIni = timeToMinutes(inicioA);
  const aFim = timeToMinutes(fimA);
  const bIni = timeToMinutes(inicioB);
  const bFim = timeToMinutes(fimB);

  return Math.max(aIni, bIni) < Math.min(aFim, bFim);
}

function formatDate(d: Date): string {
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

// ==========================================
// 3. MOTOR DE PROJEÇÃO DE DATAS
// ==========================================

/**
 * Projeta todas as datas válidas de um bloco de horário para o mês e ano informados.
 * @param regra Regra do bloco de horário
 * @param ano Ano (ex.: 2026)
 * @param mes Mês de 1 a 12 (ex.: 10 para Outubro)
 */
export function calcularDatasDoMes(
  regra: RegraBlocoHorario,
  ano: number,
  mes: number
): DataSessaoProjetada[] {
  const totalDiasMes = new Date(ano, mes, 0).getDate();
  const duracao = calcularDuracaoMinutos(regra.horaInicio, regra.horaFim);
  const resultados: DataSessaoProjetada[] = [];

  const tipo = regra.tipoRecorrencia || "semanal";

  // CASO 1: SEMANAL
  if (tipo === "semanal") {
    const diaAlvo = regra.diaSemana ?? 1; // Default segunda
    for (let d = 1; d <= totalDiasMes; d++) {
      const dt = new Date(ano, mes - 1, d);
      if (dt.getDay() === diaAlvo) {
        resultados.push({
          data: formatDate(dt),
          diaSemana: dt.getDay(),
          diaSemanaExtenso: DIAS_SEMANA_EXTENSO[dt.getDay()],
          horaInicio: regra.horaInicio,
          horaFim: regra.horaFim,
          duracaoMinutos: duracao,
          blocoId: regra.id,
          grupoId: regra.grupoId,
          responsavelId: regra.responsavelId,
          nucleoId: regra.nucleoId,
          ajustadaPorFimDeSemana: false,
        });
      }
    }
    return resultados;
  }

  // CASO 2: MENSAL COM DIA FIXO
  if (tipo === "mensal_dia_fixo") {
    const diaDesejado = Math.max(1, Math.min(totalDiasMes, regra.diaMes ?? 1));
    const dtOriginal = new Date(ano, mes - 1, diaDesejado);
    const ajuste = regra.ajusteFimDeSemana || "manter";
    const dtAjustada = ajustarFimDeSemanaEFeriado(dtOriginal, ajuste);

    const foiAjustada = formatDate(dtOriginal) !== formatDate(dtAjustada);

    resultados.push({
      data: formatDate(dtAjustada),
      diaSemana: dtAjustada.getDay(),
      diaSemanaExtenso: DIAS_SEMANA_EXTENSO[dtAjustada.getDay()],
      horaInicio: regra.horaInicio,
      horaFim: regra.horaFim,
      duracaoMinutos: duracao,
      blocoId: regra.id,
      grupoId: regra.grupoId,
      responsavelId: regra.responsavelId,
      nucleoId: regra.nucleoId,
      ajustadaPorFimDeSemana: foiAjustada,
      dataOriginal: foiAjustada ? formatDate(dtOriginal) : undefined,
    });
    return resultados;
  }

  // CASO 3: MENSAL POR DIA DA SEMANA (Ex: 1º Sábado, Última Sexta)
  if (tipo === "mensal_dia_semana") {
    const diaAlvo = regra.diaSemana ?? 6; // Default Sábado
    const ordem = regra.ordemSemanaMes ?? 1; // 1, 2, 3, 4 ou -1 (última)

    const ocorrencias: Date[] = [];
    for (let d = 1; d <= totalDiasMes; d++) {
      const dt = new Date(ano, mes - 1, d);
      if (dt.getDay() === diaAlvo) {
        ocorrencias.push(dt);
      }
    }

    let escolhida: Date | undefined;
    if (ordem === -1) {
      escolhida = ocorrencias[ocorrencias.length - 1];
    } else {
      const idx = ordem - 1;
      escolhida = ocorrencias[idx] || ocorrencias[ocorrencias.length - 1];
    }

    if (escolhida) {
      resultados.push({
        data: formatDate(escolhida),
        diaSemana: escolhida.getDay(),
        diaSemanaExtenso: DIAS_SEMANA_EXTENSO[escolhida.getDay()],
        horaInicio: regra.horaInicio,
        horaFim: regra.horaFim,
        duracaoMinutos: duracao,
        blocoId: regra.id,
        grupoId: regra.grupoId,
        responsavelId: regra.responsavelId,
        nucleoId: regra.nucleoId,
        ajustadaPorFimDeSemana: false,
      });
    }
    return resultados;
  }

  // CASO 4: PONTUAL (Dia único)
  if (tipo === "pontual" && regra.dataEspecifica) {
    const [a, m, d] = regra.dataEspecifica.split("-").map(Number);
    if (a === ano && m === mes) {
      const dt = new Date(a, m - 1, d);
      resultados.push({
        data: regra.dataEspecifica,
        diaSemana: dt.getDay(),
        diaSemanaExtenso: DIAS_SEMANA_EXTENSO[dt.getDay()],
        horaInicio: regra.horaInicio,
        horaFim: regra.horaFim,
        duracaoMinutos: duracao,
        blocoId: regra.id,
        grupoId: regra.grupoId,
        responsavelId: regra.responsavelId,
        nucleoId: regra.nucleoId,
        ajustadaPorFimDeSemana: false,
      });
    }
    return resultados;
  }

  return resultados;
}

/**
 * Projeta datas para múltiplos blocos e ordena cronologicamente
 */
export function projetarCalendarioMes(
  blocos: RegraBlocoHorario[],
  ano: number,
  mes: number
): DataSessaoProjetada[] {
  const todas: DataSessaoProjetada[] = [];
  for (const b of blocos) {
    todas.push(...calcularDatasDoMes(b, ano, mes));
  }
  return todas.sort((a, b) => {
    const cmpData = a.data.localeCompare(b.data);
    if (cmpData !== 0) return cmpData;
    return a.horaInicio.localeCompare(b.horaInicio);
  });
}

// ==========================================
// 4. PREVENÇÃO DE CONFLITOS DE ESCALA E ESPAÇO
// ==========================================

/**
 * Verifica se dois blocos são turmas parceiras (enturmação conjunta autorizada)
 */
export function saoTurmasParceiras(a: RegraBlocoHorario, b: RegraBlocoHorario): boolean {
  if (!a.grupoId || !b.grupoId) return false;
  if (a.grupoId === b.grupoId) return true; // Mesmo grupo não é conflito consigo mesmo

  const aContemB = (a.gruposAdicionaisIds || []).includes(b.grupoId);
  const bContemA = (b.gruposAdicionaisIds || []).includes(a.grupoId);

  return aContemB || bContemA;
}

/**
 * Verifica se dois blocos podem ocorrer na mesma data ou dia da semana
 */
export function blocosCompartilhamJanela(
  a: RegraBlocoHorario,
  b: RegraBlocoHorario
): { coincidem: boolean; detalhe: string } {
  // Horários precisam sobrepor
  if (!horariosSobrepoem(a.horaInicio, a.horaFim, b.horaInicio, b.horaFim)) {
    return { coincidem: false, detalhe: "" };
  }

  // Se ambos forem semanais
  if (a.tipoRecorrencia === "semanal" && b.tipoRecorrencia === "semanal") {
    if (a.diaSemana === b.diaSemana && a.diaSemana != null) {
      return { coincidem: true, detalhe: DIAS_SEMANA_EXTENSO[a.diaSemana] };
    }
  }

  // Se ambos forem pontuais
  if (a.tipoRecorrencia === "pontual" && b.tipoRecorrencia === "pontual") {
    if (a.dataEspecifica && b.dataEspecifica && a.dataEspecifica === b.dataEspecifica) {
      return { coincidem: true, detalhe: `Data ${a.dataEspecifica}` };
    }
  }

  // Se um for semanal e o outro pontual
  if (a.tipoRecorrencia === "semanal" && b.tipoRecorrencia === "pontual" && b.dataEspecifica) {
    const [ano, mes, dia] = b.dataEspecifica.split("-").map(Number);
    const dt = new Date(ano, mes - 1, dia);
    if (dt.getDay() === a.diaSemana) {
      return { coincidem: true, detalhe: `Data ${b.dataEspecifica} (${DIAS_SEMANA_EXTENSO[dt.getDay()]})` };
    }
  }
  if (b.tipoRecorrencia === "semanal" && a.tipoRecorrencia === "pontual" && a.dataEspecifica) {
    const [ano, mes, dia] = a.dataEspecifica.split("-").map(Number);
    const dt = new Date(ano, mes - 1, dia);
    if (dt.getDay() === b.diaSemana) {
      return { coincidem: true, detalhe: `Data ${a.dataEspecifica} (${DIAS_SEMANA_EXTENSO[dt.getDay()]})` };
    }
  }

  // Se um for mensal com dia da semana e outro semanal
  if (a.tipoRecorrencia === "mensal_dia_semana" && b.tipoRecorrencia === "semanal") {
    if (a.diaSemana === b.diaSemana && a.diaSemana != null) {
      return { coincidem: true, detalhe: `${DIAS_SEMANA_EXTENSO[a.diaSemana]} (recorrência mensal vs semanal)` };
    }
  }
  if (b.tipoRecorrencia === "mensal_dia_semana" && a.tipoRecorrencia === "semanal") {
    if (a.diaSemana === b.diaSemana && a.diaSemana != null) {
      return { coincidem: true, detalhe: `${DIAS_SEMANA_EXTENSO[a.diaSemana]} (recorrência semanal vs mensal)` };
    }
  }

  return { coincidem: false, detalhe: "" };
}

/**
 * Valida preventivamente choques entre blocos de horário:
 * 1. Choque de Instrutor: mesmo profissional em núcleos ou turmas diferentes ao mesmo tempo (sem enturmação conjunta)
 * 2. Choque de Espaço: mesmo núcleo ocupado por turmas diferentes ao mesmo tempo (sem enturmação conjunta)
 */
export function validarChoques(blocos: RegraBlocoHorario[]): ConflitoAgendamento[] {
  const conflitos: ConflitoAgendamento[] = [];

  for (let i = 0; i < blocos.length; i++) {
    for (let j = i + 1; j < blocos.length; j++) {
      const a = blocos[i];
      const b = blocos[j];

      // Se forem turmas parceiras declaradas, não há choque
      if (saoTurmasParceiras(a, b)) continue;

      const { coincidem, detalhe } = blocosCompartilhamJanela(a, b);
      if (!coincidem) continue;

      // 1. Choque de Instrutor
      if (a.responsavelId && b.responsavelId && a.responsavelId === b.responsavelId) {
        conflitos.push({
          tipo: "choque_instrutor",
          titulo: "Choque de Escala do Instrutor",
          mensagem: `O instrutor ${a.responsavelNome || "selecionado"} está escalado simultaneamente em "${a.grupoNome || "Turma A"}" e "${b.grupoNome || "Turma B"}" em ${detalhe} das ${a.horaInicio} às ${a.horaFim}.`,
          blocoA: a,
          blocoB: b,
          dataOuDia: detalhe,
          horaInicio: a.horaInicio,
          horaFim: a.horaFim,
        });
      }

      // 2. Choque de Espaço Físico / Núcleo
      if (a.nucleoId && b.nucleoId && a.nucleoId === b.nucleoId) {
        conflitos.push({
          tipo: "choque_espaco_nucleo",
          titulo: "Choque de Espaço no Núcleo",
          mensagem: `O espaço ${a.nucleoNome || "do núcleo"} está ocupado simultaneamente por "${a.grupoNome || "Turma A"}" e "${b.grupoNome || "Turma B"}" em ${detalhe} das ${a.horaInicio} às ${a.horaFim}.`,
          blocoA: a,
          blocoB: b,
          dataOuDia: detalhe,
          horaInicio: a.horaInicio,
          horaFim: a.horaFim,
        });
      }
    }
  }

  return conflitos;
}

/**
 * Valida se um novo bloco colide com a grade existente
 */
export function validarNovoBloco(
  novoBloco: RegraBlocoHorario,
  blocosExistentes: RegraBlocoHorario[]
): ConflitoAgendamento[] {
  return validarChoques([novoBloco, ...blocosExistentes]);
}

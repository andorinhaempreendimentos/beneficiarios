import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qrzszjogxrrjqjkoowoi.supabase.co";
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyenN6am9neHJyanFqa29vd29pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5NDk1OTUsImV4cCI6MjEwMTUyNTU5NX0.8ftSA1_vxOAbUsp32MoGnvd4gU4qNQ73NoqquYTvQZo";
  return createClient(url, key);
}

const DIAS_MAP: Record<number, string> = {
  1: "Segunda-feira",
  2: "Terça-feira",
  3: "Quarta-feira",
  4: "Quinta-feira",
  5: "Sexta-feira",
  6: "Sábado",
  7: "Domingo",
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ nucleoId: string }> }
) {
  try {
    const { nucleoId } = await params;
    if (!nucleoId) {
      return NextResponse.json({ error: "ID do núcleo não fornecido." }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // 1. Buscar núcleo (por UUID direto ou slug/identificacao)
    let { data: nucleo, error: errNuc } = await supabase
      .from("nucleos")
      .select("id, identificacao, nome_local")
      .eq("id", nucleoId)
      .is("deleted_at", null)
      .maybeSingle();

    if (!nucleo) {
      const { data: nucleoAlt } = await supabase
        .from("nucleos")
        .select("id, identificacao, nome_local")
        .ilike("identificacao", `%${decodeURIComponent(nucleoId)}%`)
        .is("deleted_at", null)
        .limit(1)
        .maybeSingle();
      nucleo = nucleoAlt;
    }

    if (!nucleo) {
      return NextResponse.json({ error: "Núcleo não encontrado." }, { status: 404 });
    }

    // 2. Buscar professor e modalidade da conferência 1
    const { data: conf1 } = await supabase
      .from("respostas_conferencia_professores")
      .select("professor_nome, modalidade_nome")
      .or(`nucleo_id.eq.${nucleo.id},nucleo_nome.eq."${nucleo.identificacao}"`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let professorNome = conf1?.professor_nome || "";
    let modalidadeNome = conf1?.modalidade_nome || "Futebol de Campo";

    if (!professorNome) {
      const { data: profFunc } = await supabase
        .from("funcionarios")
        .select("nome_completo")
        .eq("nucleo_id", nucleo.id)
        .is("deleted_at", null)
        .ilike("funcao", "%Professor%")
        .maybeSingle();
      if (profFunc) professorNome = profFunc.nome_completo;
    }

    // 3. Buscar turmas do núcleo na tabela grupos
    const { data: turmas, error: errTurmas } = await supabase
      .from("grupos")
      .select("id, nome, identificador, idade_minima, idade_maxima, vagas_totais")
      .eq("nucleo_id", nucleo.id)
      .is("deleted_at", null)
      .order("identificador");

    if (errTurmas) throw errTurmas;

    // 4. Buscar horários das turmas
    const grupoIds = (turmas || []).map((t) => t.id);
    let horariosMap: Record<string, any[]> = {};

    if (grupoIds.length > 0) {
      const { data: horarios, error: errHorarios } = await supabase
        .from("grupo_horarios")
        .select("id, grupo_id, dia_semana, hora_inicio, hora_fim")
        .in("grupo_id", grupoIds)
        .order("dia_semana")
        .order("hora_inicio");

      if (errHorarios) throw errHorarios;

      (horarios || []).forEach((h) => {
        if (!horariosMap[h.grupo_id]) horariosMap[h.grupo_id] = [];
        horariosMap[h.grupo_id].push({
          id: h.id,
          diaSemanaNumero: h.dia_semana,
          diaSemanaNome: DIAS_MAP[h.dia_semana] || `Dia ${h.dia_semana}`,
          horaInicio: h.hora_inicio ? h.hora_inicio.substring(0, 5) : "",
          horaFim: h.hora_fim ? h.hora_fim.substring(0, 5) : "",
        });
      });
    }

    // Formatar turmas com horários e faixas
    const turmasFormatadas = (turmas || []).map((t, index) => {
      const listaHorarios = horariosMap[t.id] || [];
      const diasNomes = Array.from(new Set(listaHorarios.map((h) => h.diaSemanaNome)));
      const primeiroHorario = listaHorarios[0];

      return {
        id: t.id,
        nome: t.nome,
        identificador: t.identificador || String.fromCharCode(65 + index),
        idadeMinima: t.idade_minima || 4,
        idadeMaxima: t.idade_maxima || 21,
        vagasTotais: t.vagas_totais || 40,
        horarios: listaHorarios,
        diasResumo: diasNomes.length > 0 ? diasNomes.join(", ") : "A definir",
        horarioResumo: primeiroHorario
          ? `${primeiroHorario.horaInicio} às ${primeiroHorario.horaFim}`
          : "Horário flexível",
      };
    });

    // 5. Buscar todas as submissões deste núcleo (professores e responsáveis) e agregar todos os alunos
    const { data: respostasExistentes } = await supabase
      .from("respostas_conferencia_beneficiarios")
      .select("*")
      .or(`nucleo_id.eq.${nucleo.id},nucleo_nome.eq."${nucleo.identificacao}"`)
      .order("created_at", { ascending: false });

    // Função auxiliar para calcular idade caso não venha calculada
    function calcularIdadeAluno(dataNasc?: string | null): number | null {
      if (!dataNasc) return null;
      const nasc = new Date(dataNasc);
      if (isNaN(nasc.getTime())) return null;
      const hoje = new Date();
      let idade = hoje.getFullYear() - nasc.getFullYear();
      const m = hoje.getMonth() - nasc.getMonth();
      if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
        idade--;
      }
      return idade >= 0 ? idade : null;
    }

    const alunosAgregados: any[] = [];
    const chavesVistas = new Set<string>();

    (respostasExistentes || []).forEach((resp) => {
      const listaAlunos = Array.isArray(resp.novos_alunos_cadastrados)
        ? resp.novos_alunos_cadastrados
        : [];

      listaAlunos.forEach((a: any) => {
        const nomeLimpo = (a.nomeCompleto || a.nome || "").trim().toUpperCase();
        if (!nomeLimpo) return;

        const dataNasc = a.dataNascimento ? String(a.dataNascimento).substring(0, 10) : "";
        const chave = `${nomeLimpo}_${dataNasc}`;

        if (!chavesVistas.has(chave)) {
          chavesVistas.add(chave);

          const idade =
            a.idade !== undefined && a.idade !== null
              ? a.idade
              : calcularIdadeAluno(dataNasc);

          // Se o aluno veio do formulário de responsáveis sem turmaId pré-definida,
          // sugere a melhor turma com base na idade
          let turmaId = a.turmaId || "";
          let turmaNome = a.turmaNome || "";
          let turmaIdentificador = a.turmaIdentificador || "";

          if (!turmaId && turmasFormatadas.length > 0) {
            const sugerida =
              (idade !== null
                ? turmasFormatadas.find(
                    (t) => idade >= t.idadeMinima && idade <= t.idadeMaxima
                  )
                : null) || turmasFormatadas[0];

            if (sugerida) {
              turmaId = sugerida.id;
              turmaNome = sugerida.nome;
              turmaIdentificador = sugerida.identificador;
            }
          }

          alunosAgregados.push({
            ...a,
            idTemp: a.idTemp || `agregado_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            nomeCompleto: nomeLimpo,
            dataNascimento: dataNasc,
            idade,
            sexo: a.sexo || "M",
            cpf: a.cpf || "",
            turmaId,
            turmaNome,
            turmaIdentificador,
          });
        }
      });
    });

    const respostaRecente =
      respostasExistentes && respostasExistentes.length > 0
        ? respostasExistentes[0]
        : null;

    return NextResponse.json({
      nucleo: {
        id: nucleo.id,
        identificacao: nucleo.identificacao,
        nomeLocal: nucleo.nome_local,
      },
      professor: {
        nome: professorNome || "Responsável pelo Núcleo",
      },
      modalidade: modalidadeNome,
      turmas: turmasFormatadas,
      alunosJaSalvos: alunosAgregados,
      respostaExistente: respostaRecente || null,
      totalAlunosCadastrados: alunosAgregados.length,
    });
  } catch (error: any) {
    console.error("[cadastro-alunos/[nucleoId] GET]", error);
    return NextResponse.json(
      { error: error.message || "Erro ao carregar dados do núcleo" },
      { status: 500 }
    );
  }
}

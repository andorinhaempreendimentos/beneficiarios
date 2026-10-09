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

function calcularIdade(dataNasc: string | null | undefined): number | null {
  if (!dataNasc) return null;
  const nasc = new Date(dataNasc);
  if (isNaN(nasc.getTime())) return null;
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
    idade--;
  }
  return idade;
}

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

    // 1. Buscar núcleo
    let { data: nucleo, error: errNuc } = await supabase
      .from("nucleos")
      .select("id, identificacao, nome_local")
      .eq("id", nucleoId)
      .is("deleted_at", null)
      .maybeSingle();

    if (!nucleo) {
      // Tentar buscar por identificacao ou slug se não foi UUID direto
      const { data: nucleoAlt } = await supabase
        .from("nucleos")
        .select("id, identificacao, nome_local")
        .ilike("identificacao", `%${decodeURIComponent(nucleoId)}%`)
        .is("deleted_at", null)
        .maybeSingle();
      nucleo = nucleoAlt;
    }

    if (!nucleo) {
      return NextResponse.json({ error: "Núcleo não encontrado." }, { status: 404 });
    }

    // 2. Buscar professor e modalidade da conferência 1
    const { data: conf1 } = await supabase
      .from("respostas_conferencia_professores")
      .select("professor_nome, modalidade_nome, dados_turmas")
      .or(`nucleo_id.eq.${nucleo.id},nucleo_nome.eq."${nucleo.identificacao}"`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Fallback professor de funcionarios se necessário
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

    // 3. Buscar turmas criadas para este núcleo
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

    // Montar turmas completas com horários agrupados
    const turmasFormatadas = (turmas || []).map((t) => {
      const listaHorarios = horariosMap[t.id] || [];
      const diasNomes = Array.from(new Set(listaHorarios.map((h) => h.diaSemanaNome)));
      const primeiroHorario = listaHorarios[0];

      return {
        id: t.id,
        nome: t.nome,
        identificador: t.identificador,
        idadeMinima: t.idade_minima || 4,
        idadeMaxima: t.idade_maxima || 21,
        vagasTotais: t.vagas_totais || 40,
        horarios: listaHorarios,
        diasResumo: diasNomes.join(", "),
        horarioResumo: primeiroHorario
          ? `${primeiroHorario.horaInicio} às ${primeiroHorario.horaFim}`
          : "",
      };
    });

    // 5. Buscar alunos do núcleo (LEITURA APENAS DE BENEFICIARIOS VIA RPC SEGURA)
    const { data: alunos, error: errAlunos } = await supabase.rpc("get_alunos_conferencia", {
      p_nucleo_id: nucleo.id,
    });

    if (errAlunos) throw errAlunos;

    const beneficiariosFormatados = (alunos || []).map((a: any) => {
      const idade = calcularIdade(a.data_nascimento);
      return {
        id: a.id,
        matricula: a.matricula,
        nomeCompleto: a.nome_completo,
        dataNascimento: a.data_nascimento,
        idade,
        sexo: a.sexo,
        status: a.status,
        pcd: a.pcd,
        cpf: a.cpf,
      };
    });

    // 6. Verificar se já existe resposta salva
    const { data: respostaExistente } = await supabase
      .from("respostas_conferencia_beneficiarios")
      .select("*")
      .eq("nucleo_id", nucleo.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      nucleo,
      professor: { nome: professorNome },
      modalidade: modalidadeNome,
      temAlunos: beneficiariosFormatados.length > 0,
      totalAlunosSistema: beneficiariosFormatados.length,
      turmas: turmasFormatadas,
      beneficiarios: beneficiariosFormatados,
      respostaExistente: respostaExistente || null,
    });
  } catch (error: any) {
    console.error("[conferencia-beneficiarios/[nucleoId] GET]", error);
    return NextResponse.json(
      { error: error.message || "Erro ao carregar dados do núcleo" },
      { status: 500 }
    );
  }
}

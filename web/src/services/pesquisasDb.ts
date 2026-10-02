import { createClient } from "@/lib/supabase/client";

const supabase: any = createClient();

const MATRICULA_SALT = "andorinha_beneficiario_2026";

export function encodeMatricula(matricula: string): string {
  if (!matricula) return "";
  try {
    const textBytes = new TextEncoder().encode(matricula.trim());
    const saltBytes = new TextEncoder().encode(MATRICULA_SALT);
    const xorBytes = new Uint8Array(textBytes.length);
    for (let i = 0; i < textBytes.length; i++) {
      xorBytes[i] = textBytes[i] ^ saltBytes[i % saltBytes.length];
    }
    let binary = "";
    for (let i = 0; i < xorBytes.length; i++) {
      binary += String.fromCharCode(xorBytes[i]);
    }
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  } catch {
    return matricula;
  }
}

export function decodeMatricula(encoded: string): string {
  if (!encoded) return "";
  try {
    let b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const saltBytes = new TextEncoder().encode(MATRICULA_SALT);
    const textBytes = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      textBytes[i] = bytes[i] ^ saltBytes[i % saltBytes.length];
    }
    const decoded = new TextDecoder().decode(textBytes).trim();
    return decoded || encoded;
  } catch {
    return encoded;
  }
}

export interface CategoriaCampo {
  id: string;
  nome: string;
  user_id?: string;
  created_at?: string;
}

export interface FiltrosRelatorio {
  objetoIds: string[]; // [] = todos
  pesquisaIds: string[]; // [] = todos
  liderIds: string[]; // [] = todos
  categoriasFiltros: {
    categoriaId: string;
    categoriaNome: string;
    valoresSelecionados: string[]; // [] = todos os valores
  }[];
  tags?: string[];
}

export interface RelatorioSalvo {
  id: string;
  nome: string;
  descricao: string | null;
  filtros: FiltrosRelatorio;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Objeto {
  id: string;
  nome: string;
  descricao: string | null;
  tipo: "projeto" | "evento";
  termo_fomento: string | null;
  codigo_objeto: string | null;
  codigo_programa: string | null;
  nome_programa: string | null;
  user_id?: string;
  created_at?: string;
}

export interface Lider {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  user_id?: string;
  created_at?: string;
}

export interface Fluxo {
  id: string;
  nome: string;
  descricao: string | null;
  flow_data: any;
  tipo?: "fluxo" | "bloco";
  user_id?: string;
  created_at?: string;
}

export interface Pesquisa {
  id: string;
  titulo: string;
  descricao: string | null;
  token: string;
  publicada: boolean;
  exigir_cpf: boolean;
  objeto_id: string | null;
  coordenador_id?: string | null;
  lider_id?: string | null;
  fluxo_id: string | null;
  nucleo_id?: string | null;
  turma_id?: string | null;
  user_id?: string;
  created_at?: string;
}

export interface Pergunta {
  id: string;
  fluxo_id: string;
  tipo:
    | "texto_curto"
    | "textarea"
    | "multipla"
    | "whatsapp"
    | "email"
    | "cpf"
    | "cep"
    | "estado"
    | "cidade"
    | "bairro"
    | "logradouro"
    | "numero"
    | "avaliacao";
  titulo: string;
  obrigatoria: boolean;
  ordem: number;
  categoria_id?: string | null;
  config: {
    opcoes?: { id: string; texto: string }[];
    min_respostas?: number;
    max_respostas?: number;
  };
  created_at?: string;
}

export interface Resposta {
  id: string;
  pesquisa_id: string;
  fingerprint: string;
  cpf?: string;
  beneficiario_id?: string | null;
  matricula?: string | null;
  nucleo_id?: string | null;
  turma_id?: string | null;
  created_at?: string;
}

export interface RespostaItem {
  id: string;
  resposta_id: string;
  pergunta_id: string;
  valor: any;
}

export const dbService = {
  // --- OBJETOS ---
  async getObjetos(): Promise<Objeto[]> {
    const { data, error } = await supabase
      .from("objetos")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map((o: any) => ({
      id: o.id,
      nome: o.nome,
      descricao: o.descricao || null,
      tipo: o.tipo_duracao === 'evento' ? 'evento' : 'projeto',
      termo_fomento: o.termo_de_fomento || null,
      codigo_objeto: o.codigo_objeto || null,
      codigo_programa: o.codigo_programa || null,
      nome_programa: o.nome_programa || null,
      created_at: o.created_at
    }));
  },

  async saveObjeto(objeto: Omit<Objeto, "id" | "created_at"> & { id?: string }): Promise<Objeto> {
    const payload: any = {
      nome: objeto.nome,
      descricao: objeto.descricao || null,
      tipo_duracao: objeto.tipo === 'evento' ? 'evento' : 'periodo',
      termo_de_fomento: objeto.termo_fomento || null,
      codigo_objeto: objeto.codigo_objeto || null,
      codigo_programa: objeto.codigo_programa || null,
      nome_programa: objeto.nome_programa || null
    };

    if (objeto.id) {
      const { data, error } = await supabase
        .from("objetos")
        .update(payload)
        .eq("id", objeto.id)
        .select()
        .single();
      if (error) throw error;
      return {
        id: data.id,
        nome: data.nome,
        descricao: data.descricao || null,
        tipo: data.tipo_duracao === 'evento' ? 'evento' : 'projeto',
        termo_fomento: data.termo_de_fomento || null,
        codigo_objeto: data.codigo_objeto || null,
        codigo_programa: data.codigo_programa || null,
        nome_programa: data.nome_programa || null,
        created_at: data.created_at
      };
    } else {
      const { data, error } = await supabase
        .from("objetos")
        .insert({ ...payload, status: 'ativo' })
        .select()
        .single();
      if (error) throw error;
      return {
        id: data.id,
        nome: data.nome,
        descricao: data.descricao || null,
        tipo: data.tipo_duracao === 'evento' ? 'evento' : 'projeto',
        termo_fomento: data.termo_de_fomento || null,
        codigo_objeto: data.codigo_objeto || null,
        codigo_programa: data.codigo_programa || null,
        nome_programa: data.nome_programa || null,
        created_at: data.created_at
      };
    }
  },

  async deleteObjeto(id: string): Promise<void> {
    const { error } = await supabase
      .from("objetos")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  },

  async getObjetoById(id: string): Promise<Objeto | null> {
    const { data, error } = await supabase
      .from("objetos")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      id: data.id,
      nome: data.nome,
      descricao: data.descricao || null,
      tipo: data.tipo_duracao === 'evento' ? 'evento' : 'projeto',
      termo_fomento: data.termo_de_fomento || null,
      codigo_objeto: data.codigo_objeto || null,
      codigo_programa: data.codigo_programa || null,
      nome_programa: data.nome_programa || null,
      created_at: data.created_at
    };
  },

  // --- COORDENADORES ---
  async getCoordenadores(): Promise<{ id: string; nome: string }[]> {
    const { data } = await supabase
      .from("funcionarios")
      .select("id, nome_completo")
      .is("deleted_at", null)
      .order("nome_completo", { ascending: true });
    return (data || []).map((f: any) => ({ id: f.id, nome: f.nome_completo }));
  },

  // --- LÍDERES ---
  async getLideres(): Promise<Lider[]> {
    const { data, error } = await supabase.from("lider").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async saveLider(lider: Omit<Lider, "id" | "created_at"> & { id?: string }): Promise<Lider> {
    if (lider.id) {
      const { data, error } = await supabase.from("lider").update(lider).eq("id", lider.id).select().single();
      if (error) throw error;
      return data;
    } else {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("lider")
        .insert({ ...lider, user_id: userData.user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  async deleteLider(id: string): Promise<void> {
    const { error } = await supabase.from("lider").delete().eq("id", id);
    if (error) throw error;
  },

  async getLiderById(id: string): Promise<Lider | null> {
    const { data, error } = await supabase.from("lider").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data;
  },

  // --- FLUXOS ---
  async getFluxos(): Promise<Fluxo[]> {
    const { data, error } = await supabase.from("fluxo").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getFluxoById(id: string): Promise<Fluxo | null> {
    const { data, error } = await supabase.from("fluxo").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data;
  },

  async saveFluxo(fluxo: Omit<Fluxo, "id" | "created_at"> & { id?: string }): Promise<Fluxo> {
    if (fluxo.id) {
      const { id, user_id, created_at, ...updatePayload } = fluxo as any;
      const { data: updatedRows, error } = await supabase
        .from("fluxo")
        .update(updatePayload)
        .eq("id", id)
        .select("id");

      if (error) throw error;
      if (!updatedRows || updatedRows.length === 0) {
        throw new Error("O fluxo não pôde ser salvo.");
      }

      const { data, error: fetchError } = await supabase.from("fluxo").select("*").eq("id", id).maybeSingle();
      if (fetchError) throw fetchError;
      return data as Fluxo;
    } else {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("fluxo")
        .insert({ ...fluxo, user_id: userData.user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  async deleteFluxo(id: string): Promise<void> {
    const { error } = await supabase.from("fluxo").delete().eq("id", id);
    if (error) throw error;
  },

  // --- PESQUISAS ---
  async getPesquisas(): Promise<Pesquisa[]> {
    const { data, error } = await supabase.from("pesquisa").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getPesquisaById(id: string): Promise<Pesquisa | null> {
    const { data, error } = await supabase.from("pesquisa").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data;
  },

  async getPesquisaByToken(token: string): Promise<(Pesquisa & { fluxo?: Fluxo }) | null> {
    const { data, error } = await supabase
      .from("pesquisa")
      .select("*, fluxo:fluxo_id(*)")
      .eq("token", token)
      .eq("publicada", true)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async savePesquisa(pesquisa: Omit<Pesquisa, "id" | "created_at"> & { id?: string }): Promise<Pesquisa> {
    if (pesquisa.id) {
      const { id, user_id, created_at, ...updatePayload } = pesquisa as any;
      const { data: updatedRows, error } = await supabase
        .from("pesquisa")
        .update(updatePayload)
        .eq("id", id)
        .select("id");

      if (error) throw error;
      if (!updatedRows || updatedRows.length === 0) {
        throw new Error("A pesquisa não pôde ser salva.");
      }

      const { data, error: fetchError } = await supabase.from("pesquisa").select("*").eq("id", id).maybeSingle();
      if (fetchError) throw fetchError;
      return data as Pesquisa;
    } else {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("pesquisa")
        .insert({ ...pesquisa, user_id: userData.user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  async deletePesquisa(id: string): Promise<void> {
    const { error } = await supabase.from("pesquisa").delete().eq("id", id);
    if (error) throw error;
  },

  // --- PERGUNTAS ---
  async getPerguntas(fluxoId: string): Promise<Pergunta[]> {
    const { data, error } = await supabase
      .from("pergunta")
      .select("*")
      .eq("fluxo_id", fluxoId)
      .order("ordem", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async syncPerguntas(fluxoId: string, perguntas: Omit<Pergunta, "created_at">[]): Promise<void> {
    await supabase.from("pergunta").delete().eq("fluxo_id", fluxoId);
    if (perguntas.length > 0) {
      const { error } = await supabase.from("pergunta").insert(
        perguntas.map((q) => {
          const { id, ...rest } = q;
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
          return isUuid ? { id, ...rest } : rest;
        })
      );
      if (error) throw error;
    }
  },

  // --- RESPOSTAS ---
  async saveRespostaCompleta(
    pesquisaId: string,
    fingerprint: string,
    itens: { pergunta_id: string; valor: any }[],
    cpf?: string,
    meta?: {
      beneficiarioId?: string;
      matricula?: string;
      nucleoId?: string;
      turmaId?: string;
    }
  ): Promise<void> {
    const payload: any = {
      pesquisa_id: pesquisaId,
      fingerprint,
    };
    if (cpf) payload.cpf = cpf.replace(/\D/g, "");
    if (meta?.beneficiarioId) payload.beneficiario_id = meta.beneficiarioId;
    if (meta?.matricula) payload.matricula = meta.matricula;
    if (meta?.nucleoId) payload.nucleo_id = meta.nucleoId;
    if (meta?.turmaId) payload.turma_id = meta.turmaId;

    const { data: respData, error: respError } = await supabase
      .from("resposta")
      .insert(payload)
      .select()
      .single();

    if (respError) throw respError;

    const itemsToInsert = itens.map((item) => ({
      resposta_id: respData.id,
      pergunta_id: item.pergunta_id,
      valor: item.valor,
    }));

    const { error: itemsError } = await supabase.from("resposta_item").insert(itemsToInsert);
    if (itemsError) throw itemsError;
  },

  async hasMatriculaResponded(pesquisaId: string, matricula: string): Promise<boolean> {
    if (!matricula) return false;
    const { data, error } = await supabase
      .from("resposta")
      .select("id")
      .eq("pesquisa_id", pesquisaId)
      .eq("matricula", matricula.trim())
      .maybeSingle();
    if (error) throw error;
    return !!data;
  },

  async getNucleos(): Promise<{ id: string; identificacao: string }[]> {
    const { data, error } = await supabase
      .from("nucleos")
      .select("id, identificacao")
      .is("deleted_at", null)
      .order("identificacao", { ascending: true });
    if (error) return [];
    return data || [];
  },

  async getTurmas(nucleoId?: string): Promise<{ id: string; nome: string; nucleo_id: string }[]> {
    let q = supabase
      .from("turmas")
      .select("id, nome, nucleo_id")
      .is("deleted_at", null)
      .order("nome", { ascending: true });
    if (nucleoId) q = q.eq("nucleo_id", nucleoId);
    const { data, error } = await q;
    if (error) return [];
    return data || [];
  },

  async getAlunosTurmaComStatus(turmaId: string | null | undefined, pesquisaId: string, nucleoId?: string | null): Promise<{
    id: string;
    matricula: string;
    nomeCompleto: string;
    celular?: string;
    celularResponsavel?: string;
    status: 'respondido' | 'pendente';
    respondidoEm?: string;
  }[]> {
    let alunos: any[] = [];

    if (turmaId) {
      const { data: btData, error: btErr } = await supabase
        .from("beneficiario_turmas")
        .select("beneficiarios(id, matricula, nome_completo, celular, celular_responsavel)")
        .eq("turma_id", turmaId)
        .eq("status", "ativo")
        .is("deleted_at", null);

      if (!btErr && btData) {
        alunos = btData
          .map((item: any) => item.beneficiarios)
          .filter(Boolean);
      }
    } else if (nucleoId) {
      const { data: bData, error: bErr } = await supabase
        .from("beneficiarios")
        .select("id, matricula, nome_completo, celular, celular_responsavel")
        .eq("nucleo_id", nucleoId)
        .eq("status", "ativo")
        .is("deleted_at", null)
        .order("nome_completo", { ascending: true });

      if (!bErr && bData) {
        alunos = bData;
      }
    }

    if (alunos.length === 0) return [];

    const { data: respData } = await supabase
      .from("resposta")
      .select("matricula, beneficiario_id, created_at")
      .eq("pesquisa_id", pesquisaId);

    const respondidosMap = new Map<string, string>();
    (respData || []).forEach((r: any) => {
      if (r.matricula) respondidosMap.set(r.matricula, r.created_at);
      if (r.beneficiario_id) respondidosMap.set(r.beneficiario_id, r.created_at);
    });

    return alunos.map((a: any) => {
      const respTime = respondidosMap.get(a.matricula) || respondidosMap.get(a.id);
      return {
        id: a.id,
        matricula: a.matricula,
        nomeCompleto: a.nome_completo,
        celular: a.celular,
        celularResponsavel: a.celular_responsavel,
        status: respTime ? 'respondido' : 'pendente',
        respondidoEm: respTime,
      };
    });
  },

  async getDesafioBeneficiario(matricula: string) {
    const { data: aluno, error } = await supabase
      .from("beneficiarios")
      .select("id, matricula, nome_completo, data_nascimento, nucleo_id")
      .eq("matricula", matricula.trim())
      .is("deleted_at", null)
      .maybeSingle();

    if (error || !aluno) return null;

    const mesesNomes = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    const partesNome = (aluno.nome_completo || "").trim().split(/\s+/);
    const primeiroNomeReal = partesNome[0] || "Aluno";
    const ultimoSobrenomeReal = partesNome.length > 1 ? partesNome[partesNome.length - 1] : "";

    const dNasc = aluno.data_nascimento ? new Date(aluno.data_nascimento + "T12:00:00Z") : new Date("2012-05-15T12:00:00Z");
    const diaReal = String(dNasc.getUTCDate()).padStart(2, "0");
    const mesIdx = dNasc.getUTCMonth();
    const mesReal = mesesNomes[mesIdx] || "Janeiro";
    const anoReal = String(dNasc.getUTCFullYear());

    let queryOutros = supabase
      .from("beneficiarios")
      .select("nome_completo, data_nascimento")
      .neq("id", aluno.id)
      .is("deleted_at", null)
      .limit(30);

    if (aluno.nucleo_id) {
      queryOutros = queryOutros.eq("nucleo_id", aluno.nucleo_id);
    }
    const { data: outrosAlunos } = await queryOutros;

    const outrosNomes = Array.from(new Set(
      (outrosAlunos || [])
        .map((o: any) => (o.nome_completo || "").trim().split(/\s+/)[0])
        .filter((n: string) => n && n.toLowerCase() !== primeiroNomeReal.toLowerCase())
    ));
    const distratorNome1 = outrosNomes[0] || "Lucas";
    const distratorNome2 = outrosNomes[1] || "Matheus";

    const outrosSobrenomes = Array.from(new Set(
      (outrosAlunos || [])
        .map((o: any) => {
          const parts = (o.nome_completo || "").trim().split(/\s+/);
          return parts.length > 1 ? parts[parts.length - 1] : "";
        })
        .filter((s: string) => s && s.toLowerCase() !== ultimoSobrenomeReal.toLowerCase())
    ));
    const distratorSobrenome1 = outrosSobrenomes[0] || "Silva";
    const distratorSobrenome2 = outrosSobrenomes[1] || "Santos";

    const diaNum = parseInt(diaReal, 10);
    const distratorDia1 = String((diaNum + 7 > 28 ? diaNum - 7 : diaNum + 7)).padStart(2, "0");
    const distratorDia2 = String((diaNum - 4 < 1 ? diaNum + 11 : diaNum - 4)).padStart(2, "0");

    const outrosMeses = mesesNomes.filter((m) => m !== mesReal);
    const distratorMes1 = outrosMeses[(mesIdx + 3) % outrosMeses.length];
    const distratorMes2 = outrosMeses[(mesIdx + 7) % outrosMeses.length];

    const anoNum = parseInt(anoReal, 10);
    const distratorAno1 = String(anoNum - 2);
    const distratorAno2 = String(anoNum + 2);

    function shuffle<T>(arr: T[]): T[] {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    const { data: btData } = await supabase
      .from("beneficiario_turmas")
      .select("turma_id")
      .eq("beneficiario_id", aluno.id)
      .eq("status", "ativo")
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle();

    const turmaIdAtiva = btData?.turma_id || null;

    return {
      beneficiarioId: aluno.id,
      matricula: aluno.matricula,
      nomeCompleto: aluno.nome_completo,
      nucleoId: aluno.nucleo_id,
      turmaId: turmaIdAtiva,
      desafio: [
        {
          id: "nome",
          pergunta: "Qual é o seu primeiro nome?",
          opcoes: shuffle([primeiroNomeReal, distratorNome1, distratorNome2]),
          correto: primeiroNomeReal,
        },
        {
          id: "dia",
          pergunta: "Qual é o dia do seu nascimento?",
          opcoes: shuffle([diaReal, distratorDia1, distratorDia2]),
          correto: diaReal,
        },
        {
          id: "mes",
          pergunta: "Qual é o mês do seu nascimento?",
          opcoes: shuffle([mesReal, distratorMes1, distratorMes2]),
          correto: mesReal,
        },
        {
          id: "ano",
          pergunta: "Qual é o ano do seu nascimento?",
          opcoes: shuffle([anoReal, distratorAno1, distratorAno2]),
          correto: anoReal,
        },
        ...(ultimoSobrenomeReal ? [{
          id: "sobrenome",
          pergunta: "Qual é o seu último sobrenome?",
          opcoes: shuffle([ultimoSobrenomeReal, distratorSobrenome1, distratorSobrenome2]),
          correto: ultimoSobrenomeReal,
        }] : [])
      ],
    };
  },

  async hasCpfResponded(pesquisaId: string, cpf: string): Promise<boolean> {
    const cpfNormalizado = cpf.replace(/\D/g, "").toLowerCase();
    if (cpfNormalizado === "1111111111x".replace(/\D/g, "").toLowerCase() || cpf.toLowerCase() === "1111111111x") {
      return false;
    }
    const { data, error } = await supabase
      .from("resposta")
      .select("id")
      .eq("pesquisa_id", pesquisaId)
      .eq("cpf", cpf.replace(/\D/g, ""))
      .maybeSingle();
    if (error) throw error;
    return !!data;
  },

  async hasDeviceResponded(pesquisaId: string, fingerprint: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("resposta")
      .select("id")
      .eq("pesquisa_id", pesquisaId)
      .eq("fingerprint", fingerprint)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  },

  async getRespostasCounts(): Promise<Record<string, number>> {
    const { data, error } = await supabase.from("resposta").select("pesquisa_id");
    if (error) throw error;
    const counts: Record<string, number> = {};
    (data || []).forEach((r: any) => {
      counts[r.pesquisa_id] = (counts[r.pesquisa_id] || 0) + 1;
    });
    return counts;
  },

  // --- RELATÓRIOS ---
  async getRelatorios(pesquisaId: string): Promise<{
    totalRespostas: number;
    respostas: { id: string; created_at: string; valores: Record<string, any> }[];
  }> {
    const { data: respostas, error: respError } = await supabase
      .from("resposta")
      .select("id, created_at")
      .eq("pesquisa_id", pesquisaId)
      .order("created_at", { ascending: false });

    if (respError) throw respError;
    if (!respostas || respostas.length === 0) return { totalRespostas: 0, respostas: [] };

    const respostaIds = respostas.map((r: any) => r.id);

    const { data: itens, error: itensError } = await supabase
      .from("resposta_item")
      .select("resposta_id, pergunta_id, valor")
      .in("resposta_id", respostaIds);

    if (itensError) throw itensError;

    const formatted = respostas.map((r: any) => {
      const rItens = (itens || []).filter((i: any) => i.resposta_id === r.id);
      const valores: Record<string, any> = {};
      rItens.forEach((i: any) => {
        valores[i.pergunta_id] = i.valor;
      });
      return { id: r.id, created_at: r.created_at, valores };
    });

    return { totalRespostas: respostas.length, respostas: formatted };
  },

  // --- CATEGORIAS DE CAMPO ---
  async getCategorias(): Promise<CategoriaCampo[]> {
    const { data, error } = await supabase.from("categoria_campo").select("*").order("nome", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async saveCategoria(categoria: Omit<CategoriaCampo, "id" | "created_at"> & { id?: string }): Promise<CategoriaCampo> {
    if (categoria.id) {
      const { data, error } = await supabase
        .from("categoria_campo")
        .update({ nome: categoria.nome })
        .eq("id", categoria.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("categoria_campo")
        .insert({ nome: categoria.nome, user_id: userData.user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  async deleteCategoria(id: string): Promise<void> {
    const { error } = await supabase.from("categoria_campo").delete().eq("id", id);
    if (error) throw error;
  },

  // --- RELATÓRIOS SALVOS ---
  async getRelatoriosSalvos(): Promise<RelatorioSalvo[]> {
    const { data, error } = await supabase.from("relatorio_salvo").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async saveRelatorioSalvo(
    rel: Omit<RelatorioSalvo, "id" | "created_at" | "updated_at"> & { id?: string }
  ): Promise<RelatorioSalvo> {
    if (rel.id) {
      const { data, error } = await supabase
        .from("relatorio_salvo")
        .update({
          nome: rel.nome,
          descricao: rel.descricao,
          filtros: rel.filtros,
          updated_at: new Date().toISOString(),
        })
        .eq("id", rel.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("relatorio_salvo")
        .insert({
          nome: rel.nome,
          descricao: rel.descricao,
          filtros: rel.filtros,
          user_id: userData.user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  async deleteRelatorioSalvo(id: string): Promise<void> {
    const { error } = await supabase.from("relatorio_salvo").delete().eq("id", id);
    if (error) throw error;
  },

  // --- RELATÓRIOS GLOBAIS ---
  async getPerguntasByFluxos(fluxoIds: string[]): Promise<Pergunta[]> {
    if (fluxoIds.length === 0) return [];
    const { data, error } = await supabase
      .from("pergunta")
      .select("*")
      .in("fluxo_id", fluxoIds)
      .order("ordem", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getRelatoriosGlobais(pesquisaIds: string[]): Promise<{
    respostas: {
      id: string;
      created_at: string;
      pesquisa_id: string;
      pesquisa_titulo: string;
      lider_nome: string | null;
      coordenador_nome: string | null;
      objeto_nome: string | null;
      valores: Record<string, any>;
    }[];
    total: number;
  }> {
    if (pesquisaIds.length === 0) return { respostas: [], total: 0 };

    const { data: pesquisas, error: pErr } = await supabase
      .from("pesquisa")
      .select("id, titulo, coordenador:coordenador_id(nome_completo), lider:lider_id(nome), objeto:objeto_id(nome)")
      .in("id", pesquisaIds);
    if (pErr) throw pErr;

    const { data: respostas, error: rErr } = await supabase
      .from("resposta")
      .select("id, created_at, pesquisa_id")
      .in("pesquisa_id", pesquisaIds)
      .order("created_at", { ascending: false });
    if (rErr) throw rErr;
    if (!respostas || respostas.length === 0) return { respostas: [], total: 0 };

    const respostaIds = respostas.map((r: any) => r.id);
    const { data: itens, error: iErr } = await supabase
      .from("resposta_item")
      .select("resposta_id, pergunta_id, valor")
      .in("resposta_id", respostaIds);
    if (iErr) throw iErr;

    const pesquisaMap: Record<string, any> = {};
    (pesquisas || []).forEach((p: any) => {
      pesquisaMap[p.id] = p;
    });

    const formatted = respostas.map((r: any) => {
      const rItens = (itens || []).filter((i: any) => i.resposta_id === r.id);
      const valores: Record<string, any> = {};
      rItens.forEach((i: any) => {
        valores[i.pergunta_id] = i.valor;
      });
      const pesq = pesquisaMap[r.pesquisa_id];
      const coordNome = pesq?.coordenador?.nome_completo || pesq?.lider?.nome || null;
      return {
        id: r.id,
        created_at: r.created_at,
        pesquisa_id: r.pesquisa_id,
        pesquisa_titulo: pesq?.titulo || "",
        lider_nome: coordNome,
        coordenador_nome: coordNome,
        objeto_nome: pesq?.objeto?.nome || null,
        valores,
      };
    });

    return { respostas: formatted, total: formatted.length };
  },

  async getNucleosCoordenador(coordenadorId: string): Promise<string[]> {
    if (!coordenadorId) return [];
    const { data, error } = await supabase
      .from("coordenador_nucleos")
      .select("nucleo_id")
      .eq("coordenador_id", coordenadorId)
      .eq("ativo", true);
    if (error || !data) return [];
    return data.map((item: any) => item.nucleo_id);
  },
};

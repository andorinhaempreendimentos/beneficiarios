import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// Catálogo Base INEP / Palmas-TO e Escolas Municipais e Estaduais
const ESCOLAS_INEP_BASE: string[] = [
  "Escola Municipal Anne Frank",
  "Escola Municipal Ayrton Senna",
  "Escola Municipal Beatriz Rodrigues da Silva",
  "Escola Municipal Benedita Galvão",
  "Escola Municipal Cora Carolina",
  "Escola Municipal Daniel Batista",
  "Escola Municipal Darcy Ribeiro",
  "Escola Municipal Estêvão de Castro",
  "Escola Municipal Eurídice de Melo",
  "Escola Municipal Henrique Talone Pinheiro",
  "Escola Municipal Jorge Amado",
  "Escola Municipal Lúcia Sales",
  "Escola Municipal Margarida Lemos",
  "Escola Municipal Maria Júlia",
  "Escola Municipal Monsenhor Pedro Pereira Piagem",
  "Escola Municipal Monteiro Lobato",
  "Escola Municipal Padre Josimo",
  "Escola Municipal Pastor Paulo Leivas Macalão",
  "Escola Municipal Príncipes e Princesas",
  "Escola Municipal Rachel de Queiroz",
  "Escola Municipal Sávia Fernandes",
  "Escola Municipal Thiago Barbosa",
  "Escola Municipal Vinícius de Moraes",
  "Escola de Tempo Integral Almirante Tamandaré",
  "Escola de Tempo Integral Anísio Spínola",
  "Escola de Tempo Integral Daniel Batista",
  "Escola de Tempo Integral Fidêncio Bôgo",
  "Escola de Tempo Integral João Beltrão",
  "Escola de Tempo Integral Margarida Lemos",
  "Escola de Tempo Integral Monsenhor Pedro Pereira Piagem",
  "Escola de Tempo Integral Santa Bárbara",
  "CMEI Cantinho da Alegria",
  "CMEI Castelo Encantado",
  "CMEI Fontes do Saber",
  "CMEI Maria dos Reis Alves Barros",
  "CMEI Paraíso Infantil",
  "CMEI Professora Jucéia Garbelini",
  "CMEI Vitória Régia",
  "Colégio Militar do Estado do Tocantins (CMTO)",
  "Centro de Ensino Médio Castro Alves",
  "Centro de Ensino Médio de Taquaralto",
  "Escola Estadual Maria dos Reis Alves Barros",
  "Escola Estadual Professora Elizângela Glória Cardoso",
  "Colégio Batista de Palmas",
  "Colégio Marista de Palmas",
  "Colégio Objetivo Palmas"
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const termo = (searchParams.get("q") || "").trim().toLowerCase();
    const municipio = searchParams.get("municipio") || "1721000";

    // 1. Tentar chamada à API do INEP caso disponível
    let escolasInepOnline: string[] = [];
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`http://api.dadosabertosinep.org/v1/ideb/escolas.json?codigo_municipio=${municipio}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          escolasInepOnline = data
            .map((item: any) => item.nome_escola || item.nome || item.escola)
            .filter((n: any): n is string => typeof n === "string" && n.trim().length > 0);
        }
      }
    } catch {
      // Falha silenciosa de rede/DNS na API externa - fallback para catálogo local e banco
    }

    // 2. Buscar escolas reais já utilizadas no banco
    let escolasDoBanco: string[] = [];
    try {
      const sb = getSupabaseClient();
      if (sb) {
        const { data } = await sb
          .from("beneficiarios")
          .select("nome_escola")
          .not("nome_escola", "is", null)
          .limit(300);

        if (data) {
          escolasDoBanco = data
            .map((r: { nome_escola: string | null }) => (r.nome_escola || "").trim())
            .filter((n: string) => n.length > 2 && !n.toLowerCase().includes("matrícula:"));
        }
      }
    } catch {
      // fallback gracioso se DB offline
    }

    // 3. Unificar listas mantendo nomes padronizados e sem duplicidades
    const mapaUnico = new Map<string, string>();

    const adicionarLista = (lista: string[]) => {
      for (const item of lista) {
        const limpo = item.trim();
        if (limpo.length < 3) continue;
        const chave = limpo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (!mapaUnico.has(chave)) {
          mapaUnico.set(chave, limpo);
        }
      }
    };

    adicionarLista(ESCOLAS_INEP_BASE);
    adicionarLista(escolasInepOnline);
    adicionarLista(escolasDoBanco);

    let resultado = Array.from(mapaUnico.values());

    // 4. Filtrar pelo termo pesquisado (se houver)
    if (termo) {
      const termoNormalizado = termo.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      resultado = resultado.filter((e) =>
        e.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(termoNormalizado)
      );
    }

    // Retorna no máximo 30 sugestões ordenadas
    resultado.sort((a, b) => a.localeCompare(b, "pt-BR"));
    const retorno = resultado.slice(0, 30);

    return NextResponse.json({ escolas: retorno });
  } catch {
    return NextResponse.json({ escolas: ESCOLAS_INEP_BASE.slice(0, 25) });
  }
}

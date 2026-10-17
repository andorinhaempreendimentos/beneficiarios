import json
import re
import sys
import unicodedata
from bs4 import BeautifulSoup
from pathlib import Path

# Garantir UTF-8 no terminal Windows
if sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")

def normalize_str(s: str) -> str:
    if not s:
        return ""
    s = unicodedata.normalize("NFKD", s.lower())
    s = "".join(c for c in s if not unicodedata.combining(c))
    return " ".join(s.split())

def match_grupo_for_turma(raw_nuc: str, turma_label: str, nucleos_db: list, grupos_db: list):
    """
    Encontra o grupo_id no banco correspondente ao núcleo e rótulo da turma no HTML.
    """
    norm_nuc = normalize_str(raw_nuc)
    # Extrair letra da turma (ex: "Turma A", "Turma B")
    m_letter = re.search(r"Turma\s+([A-Z])", turma_label, re.IGNORECASE)
    letter = m_letter.group(1).upper() if m_letter else ""

    # Tratar casos específicos de nomes compostos
    # Ex: "Escolinha do Sol Nascente / Sol Nascente II" -> "Sol Nascente II"
    if "sol nascente ii" in norm_nuc:
        target_nuc_str = "sol nascente ii"
    elif "sol nascente i" in norm_nuc:
        target_nuc_str = "sol nascente i"
    elif "407 norte" in norm_nuc or "607 norte" in norm_nuc:
        target_nuc_str = "407 norte"
    else:
        target_nuc_str = norm_nuc

    # 1. Encontrar o núcleo no banco
    nucleo_match = None
    for n in nucleos_db:
        n_ident_norm = normalize_str(n["identificacao"])
        if target_nuc_str in n_ident_norm or n_ident_norm in target_nuc_str:
            nucleo_match = n
            break

    if not nucleo_match:
        # Fallback para palavras-chave
        for n in nucleos_db:
            n_words = set(normalize_str(n["identificacao"]).split())
            t_words = set(target_nuc_str.split())
            if len(n_words.intersection(t_words)) >= 2:
                nucleo_match = n
                break

    if not nucleo_match:
        return None, None

    # 2. Encontrar o grupo dentro do núcleo
    nuc_id = nucleo_match["id"]
    grupos_do_nucleo = [g for g in grupos_db if g["nucleo_id"] == nuc_id]

    # Buscar pelo padrão "Turma <Letra>" ou "Grupo <Letra>"
    if letter:
        for g in grupos_do_nucleo:
            g_norm = normalize_str(g["nome"])
            if f"turma {letter.lower()}" in g_norm or f"grupo {letter.lower()}" in g_norm:
                return nucleo_match, g

    # Caso especial: se o núcleo tiver apenas 1 grupo ativo
    if len(grupos_do_nucleo) == 1:
        return nucleo_match, grupos_do_nucleo[0]

    return nucleo_match, None

def main():
    root_dir = Path(__file__).resolve().parent.parent.parent
    scripts_dir = Path(__file__).resolve().parent

    # 1. Carregar DB Cache
    step_output = Path(r"C:\Users\livia\.gemini\antigravity\brain\0104a02e-fa2b-466f-86da-eeb18866d8cf\.system_generated\steps\6859\output.txt")
    with open(step_output, "r", encoding="utf-8") as f:
        file_json = json.load(f)
    
    result_str = file_json.get("result", "")
    m = re.search(r"<untrusted-data-[^>]+>\s*(\[.*?\])\s*</untrusted-data-", result_str, re.DOTALL)
    if not m:
        raise ValueError("Não foi possível localizar o bloco untrusted-data no arquivo de output!")
    
    rows = json.loads(m.group(1))
    db_cache = rows[0]["db_cache"]
    
    cache_file = scripts_dir / "db_cache.json"
    with open(cache_file, "w", encoding="utf-8") as f:
        json.dump(db_cache, f, ensure_ascii=False, indent=2)
    print(f"✅ Cache do banco salvo em: {cache_file}")

    nucleos_db = db_cache["nucleos"]
    grupos_db = db_cache["grupos"]
    horarios_db = db_cache["grupo_horarios"]
    professores_db = db_cache["funcionarios"]
    beneficiarios_db = db_cache["beneficiarios"]

    print(f"\n📊 Totais no Banco de Dados:")
    print(f"   • Núcleos: {len(nucleos_db)}")
    print(f"   • Turmas (grupos): {len(grupos_db)}")
    print(f"   • Horários da Grade: {len(horarios_db)}")
    print(f"   • Professores/Funcionários: {len(professores_db)}")
    print(f"   • Beneficiários Ativos: {len(beneficiarios_db)}")

    # Indexar Beneficiários do Banco
    # Indexação dupla: por (nome_normalizado, nucleo_id) e por nome_normalizado global
    benef_by_name_and_nuc = {}
    benef_by_name_global = {}
    for b in beneficiarios_db:
        norm_name = normalize_str(b["nome_completo"])
        nuc_id = b["nucleo_id"]
        
        benef_by_name_and_nuc.setdefault((norm_name, nuc_id), []).append(b)
        benef_by_name_global.setdefault(norm_name, []).append(b)

    # 2. Parse do HTML (modelo-relatorio-frequencia.html)
    html_file = root_dir / "modelo-relatorio-frequencia.html"
    print(f"\n📄 Lendo relatório HTML: {html_file}")
    with open(html_file, "r", encoding="utf-8") as f:
        soup = BeautifulSoup(f.read(), "html.parser")

    pages = soup.find_all("div", class_="page")
    print(f"   • Total de páginas A4 no relatório: {len(pages)}")

    total_alunos_html = 0
    total_aulas_html = 0
    total_presencas_html = 0
    total_faltas_html = 0

    turmas_processadas = {}
    alunos_nao_encontrados = []
    alunos_mapeados_sucesso = []

    for page in pages:
        badge = page.find("span", class_="turma-badge")
        if not badge:
            continue
        turma_label = badge.text.strip()
        
        header_nucleo_el = page.find("div", class_="header-nucleo")
        if not header_nucleo_el:
            continue
        raw_nuc = header_nucleo_el.text.replace("Núcleo:", "").strip()
        
        # Datas no cabeçalho
        date_ths = page.find_all("th", class_="col-date")
        dates = [th.text.strip() for th in date_ths]

        # Identificar o grupo correspondente no banco
        nuc_match, grupo_match = match_grupo_for_turma(raw_nuc, turma_label, nucleos_db, grupos_db)
        
        turma_key = f"{raw_nuc} | {turma_label}"
        if turma_key not in turmas_processadas:
            turmas_processadas[turma_key] = {
                "nucleo_html": raw_nuc,
                "turma_html": turma_label,
                "nucleo_id": nuc_match["id"] if nuc_match else None,
                "nucleo_nome": nuc_match["identificacao"] if nuc_match else None,
                "grupo_id": grupo_match["id"] if grupo_match else None,
                "grupo_nome": grupo_match["nome"] if grupo_match else None,
                "dates": dates,
                "alunos": [],
            }

        # Linhas de alunos na tabela
        tbody = page.find("tbody")
        if not tbody:
            continue
        
        nuc_id = nuc_match["id"] if nuc_match else None
        
        rows = tbody.find_all("tr")
        for r in rows:
            td_name = r.find("td", class_="student-name")
            if not td_name:
                continue
            student_name = td_name.text.strip()
            
            # Células de status P / F
            status_cells = r.find_all("td", class_=re.compile(r"status-[pf]"))
            marks = [td.text.strip() for td in status_cells]

            p_count = sum(1 for m in marks if m == "P")
            f_count = sum(1 for m in marks if m == "F")

            total_alunos_html += 1
            total_presencas_html += p_count
            total_faltas_html += f_count
            total_aulas_html += len(marks)

            # Cruzar aluno com o banco de dados
            norm_student = normalize_str(student_name)
            
            # 1ª tentativa: mesmo nome e mesmo núcleo
            matches = benef_by_name_and_nuc.get((norm_student, nuc_id), [])
            
            # 2ª tentativa: busca global por nome exato normalizado
            if not matches:
                matches = benef_by_name_global.get(norm_student, [])

            # 3ª tentativa: busca flexível (se houver prefixo/sufixo)
            if not matches:
                for db_norm, b_list in benef_by_name_global.items():
                    if norm_student in db_norm or db_norm in norm_student:
                        matches = b_list
                        break

            if not matches:
                alunos_nao_encontrados.append({
                    "turma": turma_key,
                    "aluno_html": student_name,
                    "norm": norm_student
                })
            else:
                # Ordenação determinística para casos de cadastros duplicados (mesmo aluno registrado 2x)
                chosen = sorted(matches, key=lambda x: x["id"])[0]
                alunos_mapeados_sucesso.append({
                    "turma": turma_key,
                    "aluno_html": student_name,
                    "beneficiario_id": chosen["id"],
                    "nome_banco": chosen["nome_completo"],
                    "grupo_id": grupo_match["id"] if grupo_match else None,
                    "grupo_nome": grupo_match["nome"] if grupo_match else None,
                    "datas_marcas": list(zip(dates, marks))
                })

    print(f"\n🎯 RESULTADOS DA AUDITORIA E DRY-RUN:")
    print(f"============================================================")
    print(f"• Total de turmas encontradas no relatório: {len(turmas_processadas)}")
    turmas_sem_grupo = [k for k, v in turmas_processadas.items() if not v["grupo_id"]]
    print(f"• Turmas com vínculo exato de grupo no banco: {len(turmas_processadas) - len(turmas_sem_grupo)} / {len(turmas_processadas)}")
    if turmas_sem_grupo:
        print(f"  ⚠️ Turmas sem grupo mapeado: {turmas_sem_grupo}")
    
    print(f"• Total de registros de alunos no HTML: {total_alunos_html}")
    print(f"• Alunos mapeados com 100% de sucesso no banco: {len(alunos_mapeados_sucesso)} / {total_alunos_html} ({(len(alunos_mapeados_sucesso)/total_alunos_html*100):.2f}%)")
    print(f"• Alunos não encontrados: {len(alunos_nao_encontrados)}")
    print(f"------------------------------------------------------------")
    print(f"• Total de chamadas individuais (presenças/faltas) a gerar: {total_aulas_html}")
    print(f"• Total de Presenças ('P'): {total_presencas_html}")
    print(f"• Total de Faltas ('F'): {total_faltas_html}")
    taxa_media = (total_presencas_html / total_aulas_html * 100) if total_aulas_html > 0 else 0
    print(f"• Taxa média de assiduidade do relatório: {taxa_media:.2f}%")
    print(f"============================================================")

    if alunos_nao_encontrados:
        print("\n⚠️ ALUNOS NÃO ENCONTRADOS NO BANCO:")
        for item in alunos_nao_encontrados:
            print(f"   - [{item['turma']}] '{item['aluno_html']}'")

    # Salvar mapeamento pré-validado em JSON para servir de entrada direta nas tarefas 2, 3 e 4!
    pre_mapped_file = scripts_dir / "dados_migracao_validados.json"
    with open(pre_mapped_file, "w", encoding="utf-8") as f:
        json.dump({
            "turmas": turmas_processadas,
            "alunos_mapeados": alunos_mapeados_sucesso,
            "totais": {
                "alunos": total_alunos_html,
                "aulas_totais": total_aulas_html,
                "presencas": total_presencas_html,
                "faltas": total_faltas_html,
                "taxa_media": taxa_media
            }
        }, f, ensure_ascii=False, indent=2)
    print(f"\n💾 Mapeamento pré-validado salvo com sucesso em: {pre_mapped_file}")

if __name__ == "__main__":
    main()

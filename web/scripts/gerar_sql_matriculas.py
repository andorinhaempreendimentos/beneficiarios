import json
import sys
from pathlib import Path

if sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")

def main():
    scripts_dir = Path(__file__).resolve().parent
    validados_file = scripts_dir / "dados_migracao_validados.json"
    
    with open(validados_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    alunos = data["alunos_mapeados"]
    print(f"Total de alunos para matricular: {len(alunos)}")

    values_clauses = []
    for a in alunos:
        b_id = a["beneficiario_id"]
        g_id = a["grupo_id"]
        values_clauses.append(f"('{b_id}', '{g_id}', 'ativo'::status_beneficiario_turma, '2026-08-01'::date)")

    sql = (
        "INSERT INTO beneficiario_grupos (beneficiario_id, grupo_id, status, data_matricula)\n"
        "VALUES\n  " + ",\n  ".join(values_clauses) + "\n"
        "ON CONFLICT (beneficiario_id, grupo_id) DO UPDATE SET status = 'ativo', deleted_at = NULL;\n"
    )

    sql_file = scripts_dir / "sincronizar_matriculas.sql"
    with open(sql_file, "w", encoding="utf-8") as f:
        f.write(sql)
    
    print(f"✅ Arquivo SQL gerado em: {sql_file}")
    print(f"   • Total de registros SQL: {len(values_clauses)}")

if __name__ == "__main__":
    main()

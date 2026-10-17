import datetime
import json
import sys
import urllib.request
from pathlib import Path

# Garantir UTF-8 no terminal Windows
if sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")

def main():
    scripts_dir = Path(__file__).resolve().parent

    with open(scripts_dir / "dados_migracao_validados.json", "r", encoding="utf-8") as f:
        validados = json.load(f)

    with open(scripts_dir / "sessoes_geradas.json", "r", encoding="utf-8") as f:
        sessoes = json.load(f)

    # Mapa de aulas por (grupo_id, data_iso) -> aula_id
    aulas_map = {(s["grupo_id"], s["data"]): s["id"] for s in sessoes}
    print(f"Total de sessões mapeadas no cache: {len(aulas_map)}")

    alunos = validados["alunos_mapeados"]
    print(f"Total de alunos para processar presenças: {len(alunos)}")

    presencas_payload = []
    p_count = 0
    f_count = 0
    sem_sessao = []

    for a in alunos:
        b_id = a["beneficiario_id"]
        g_id = a["grupo_id"]

        for d_str, mark in a["datas_marcas"]:
            dia, mes = map(int, d_str.split("/"))
            data_iso = f"2026-{mes:02d}-{dia:02d}"

            aula_id = aulas_map.get((g_id, data_iso))
            if not aula_id:
                sem_sessao.append((a["aluno_html"], g_id, data_iso))
                continue

            status_val = "presente" if mark == "P" else "falta"
            if mark == "P":
                p_count += 1
            else:
                f_count += 1

            presencas_payload.append({
                "aula_id": aula_id,
                "beneficiario_id": b_id,
                "grupo_id": g_id,
                "data": data_iso,
                "status": status_val,
                "observacao": None
            })

    print(f"\n📊 Estatísticas do Payload de Presença:")
    print(f"   • Total de registros montados: {len(presencas_payload)}")
    print(f"   • Presenças ('presente'): {p_count}")
    print(f"   • Faltas ('falta'): {f_count}")
    taxa = (p_count / len(presencas_payload) * 100) if presencas_payload else 0
    print(f"   • Taxa de assiduidade do lote: {taxa:.2f}%")
    if sem_sessao:
        print(f"   ⚠️ Registros sem sessão encontrada: {len(sem_sessao)}")
        return

    # Enviar para o Supabase em lotes de 1000
    url = "https://qrzszjogxrrjqjkoowoi.supabase.co/rest/v1/rpc/bulk_insert_presencas"
    key = "sb_publishable_AoXvaZk10chLPIIwIWIskA_s4z1xCUY"

    batch_size = 1000
    total_enviados_bp = 0
    total_enviados_rp = 0

    print(f"\n🚀 Iniciando envio em lotes de {batch_size} para o Supabase...")

    for i in range(0, len(presencas_payload), batch_size):
        chunk = presencas_payload[i:i + batch_size]
        batch_num = (i // batch_size) + 1
        total_batches = (len(presencas_payload) + batch_size - 1) // batch_size
        
        payload_bytes = json.dumps({"payload": chunk}).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=payload_bytes,
            headers={
                "apikey": key,
                "Authorization": "Bearer " + key,
                "Content-Type": "application/json"
            }
        )

        try:
            with urllib.request.urlopen(req) as resp:
                res_body = json.loads(resp.read().decode("utf-8"))
                bp_c = res_body.get("beneficiario_presencas", 0)
                rp_c = res_body.get("registros_presenca", 0)
                total_enviados_bp += bp_c
                total_enviados_rp += rp_c
                print(f"   [Lote {batch_num}/{total_batches}] Gravados: {len(chunk)} (BP: {bp_c}, RP: {rp_c})")
        except urllib.error.HTTPError as e:
            print(f"❌ Erro no lote {batch_num}: {e.code} - {e.read().decode('utf-8')}")
            raise
        except Exception as e:
            print(f"❌ Erro inesperado no lote {batch_num}: {e}")
            raise

    print(f"\n✅ CARGA DE PRESENÇAS CONCLUÍDA COM SUCESSO!")
    print(f"   • Total em beneficiario_presencas: {total_enviados_bp}")
    print(f"   • Total em registros_presenca: {total_enviados_rp}")

if __name__ == "__main__":
    main()

"use client";

import { Card, CardBody, CardHeader } from "@/components/ui";
import {
  beneficiariosApi, funcionariosApi, nucleosApi, turmasApi, atividadesApi, objetosApi, organizacoesApi
} from "@/lib/api/services";
import { useQuery } from "@/lib/hooks/useQuery";
import { calcularIdade } from "@/lib/utils";
import type { FiltrosState } from "./FiltrosRelatorio";

interface Props { filtros: FiltrosState }

export function TabelaMinisterio({ filtros }: Props) {
  const { data: bRes } = useQuery(() => beneficiariosApi.list({ limit: 200 }), []);
  const { data: fRes } = useQuery(() => funcionariosApi.list({ limit: 200 }), []);
  const { data: nRes } = useQuery(() => nucleosApi.list({ limit: 100 }), []);
  const { data: tRes } = useQuery(() => turmasApi.list({ limit: 100 }), []);
  const { data: aRes } = useQuery(() => atividadesApi.list({ limit: 100 }), []);
  const { data: oRes } = useQuery(() => objetosApi.list({ limit: 10 }), []);
  const { data: orgRes } = useQuery(() => organizacoesApi.list({ limit: 10 }), []);

  const beneficiarios = bRes?.data ?? [];
  const funcionarios = fRes?.data ?? [];
  const nucleos = nRes?.data ?? [];
  const turmas = tRes?.data ?? [];
  const atividades = aRes?.data ?? [];
  const objeto = oRes?.data[0];
  const organizacao = orgRes?.data[0];

  const nucleosFiltrados = nucleos.filter((n) => {
    if (filtros.nucleoId) return n.id === filtros.nucleoId;
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Cabeçalho oficial */}
      <Card>
        <CardBody className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Entidade</p>
            <p className="text-zinc-800">{organizacao?.nome ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Projeto</p>
            <p className="text-zinc-800">{objeto?.nome ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Termo de Fomento</p>
            <p className="text-zinc-800">{objeto?.termoDeFomento ?? "—"}</p>
          </div>
        </CardBody>
      </Card>

      {nucleosFiltrados.map((nucleo) => {
        const turmasDoNucleo = turmas.filter((t) => t.nucleoId === nucleo.id);
        const beneficiariosDoNucleo = beneficiarios.filter(
          (b) => b.nucleoId === nucleo.id && (!filtros.status || b.status === filtros.status)
        );
        const funcionariosDoNucleo = funcionarios.filter((f) => f.nucleoId === nucleo.id);
        const diasHorarios = "Dias a definir";
        const horarios = "Horários a definir";

        return (
          <Card key={nucleo.id}>
            {/* Cabeçalho do núcleo */}
            <CardHeader>
              <div className="flex flex-col gap-0.5">
                <h3 className="text-sm font-semibold text-zinc-800">{nucleo.identificacao}</h3>
                <p className="text-xs text-zinc-400">
                  {[nucleo.endereco, nucleo.numero, nucleo.bairro, nucleo.cidade].filter(Boolean).join(", ")}
                  {diasHorarios && ` · ${diasHorarios}`}
                  {horarios && ` · ${horarios}`}
                </p>
              </div>
            </CardHeader>

            {/* RH */}
            {funcionariosDoNucleo.length > 0 && (
              <div className="border-b border-zinc-100">
                <p className="px-5 py-2 text-xs font-medium uppercase tracking-wide text-zinc-400">Recursos Humanos</p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 text-left text-xs text-zinc-400">
                      <th className="px-5 py-2">Nome</th>
                      <th className="px-5 py-2">Função</th>
                      <th className="px-5 py-2">C.H. semanal</th>
                      <th className="px-5 py-2">Telefone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {funcionariosDoNucleo.map((f) => {
                      const jornada = f.jornada ?? [];
                      const horas = jornada.filter((d) => d.trabalha && d.entrada && d.saida).reduce((acc, d) => {
                        const [hE, mE] = (d.entrada ?? "0:0").split(":").map(Number);
                        const [hS, mS] = (d.saida ?? "0:0").split(":").map(Number);
                        return acc + (hS * 60 + mS - (hE * 60 + mE));
                      }, 0);
                      return (
                        <tr key={f.id} className="border-b border-zinc-50 last:border-0">
                          <td className="px-5 py-2 text-zinc-700">{f.nomeCompleto}</td>
                          <td className="px-5 py-2 text-zinc-500">{f.funcao}</td>
                          <td className="px-5 py-2 text-zinc-500">{Math.floor(horas / 60)}h</td>
                          <td className="px-5 py-2 text-zinc-500">{f.celular ?? "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Beneficiários */}
            <div>
              <p className="px-5 py-2 text-xs font-medium uppercase tracking-wide text-zinc-400">
                Beneficiários ({beneficiariosDoNucleo.length})
              </p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 text-left text-xs text-zinc-400">
                    <th className="px-5 py-2">Nome</th>
                    <th className="px-5 py-2">CPF</th>
                    <th className="px-5 py-2">Idade</th>
                    <th className="px-5 py-2">Modalidade</th>
                  </tr>
                </thead>
                <tbody>
                  {beneficiariosDoNucleo.map((b) => {
                    return (
                      <tr key={b.id} className="border-b border-zinc-50 last:border-0">
                        <td className="px-5 py-2 font-medium text-zinc-700">{b.nomeCompleto}</td>
                        <td className="px-5 py-2 text-zinc-500">{b.cpf ?? "—"}</td>
                        <td className="px-5 py-2 text-zinc-500">{calcularIdade(b.dataNascimento)} anos</td>
                        <td className="px-5 py-2 text-zinc-500">{b.tipoMatricula ?? "Geral"}</td>
                      </tr>
                    );
                  })}
                  {beneficiariosDoNucleo.length === 0 && (
                    <tr><td colSpan={4} className="px-5 py-4 text-center text-xs text-zinc-400">Nenhum beneficiário.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

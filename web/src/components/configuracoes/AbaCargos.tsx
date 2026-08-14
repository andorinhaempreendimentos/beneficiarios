"use client";

import Link from "next/link";
import { Briefcase, ShieldCheck, Users, ExternalLink, Dumbbell, Building2, Layers, Award, Key, Lock } from "lucide-react";
import { Badge, Card, CardBody, CardHeader, LinkButton } from "@/components/ui";
import { funcoesApi, perfisApi, funcionariosApi, usuariosApi } from "@/lib/api/services";
import { useQuery } from "@/lib/hooks/useQuery";

export function AbaCargos() {
  const { data: funcoes = [] } = useQuery(() => funcoesApi.list(), []);
  const { data: perfisRes } = useQuery(() => perfisApi.list({ limit: 100 }), []);
  const { data: funcionariosRes } = useQuery(() => funcionariosApi.list({ limit: 500 }), []);
  const { data: usuariosRes } = useQuery(() => usuariosApi.list({ limit: 500 }), []);

  const perfis = perfisRes?.data ?? [];
  const funcionarios = funcionariosRes?.data ?? [];
  const usuarios = usuariosRes?.data ?? [];

  const CARGO_ICONS: Record<string, any> = {
    "Professor / Instrutor": Dumbbell,
    "Coordenador de Núcleo": Building2,
    "Coordenador de Turma": Layers,
    "Coordenador de Instrutores": Award,
    "Staff": Users,
  };

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Resumo da Estrutura de Cargos */}
      <Card className="shadow-xs bg-gradient-to-r from-sky-900 to-indigo-900 text-white">
        <CardBody className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="rounded-md bg-sky-500/30 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-sky-200 border border-sky-400/30 inline-block mb-2">
                Arquitetura de RH & Permissões RBAC
              </span>
              <h2 className="text-xl font-bold text-white">Cargos de Funcionários & Direitos de Acesso ao Painel</h2>
              <p className="text-sm text-sky-100/80 mt-1 max-w-2xl">
                Cada cargo funcional define automaticamente se os colaboradores daquela categoria possuem direito de login e acesso ao sistema.
              </p>
            </div>
            <LinkButton href="/configuracoes?aba=permissoes" className="bg-white text-sky-900 hover:bg-sky-50 font-bold shrink-0">
              Matriz de Permissões RBAC
            </LinkButton>
          </div>
        </CardBody>
      </Card>

      {/* Matriz 1 para 1: Cargo ➔ Perfil de Acesso & Regra de Login */}
      <Card className="shadow-xs">
        <CardHeader className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-zinc-800 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-sky-600" />
              <span>Cargos, Direitos de Login e Perfis de Acesso</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Mapeamento de permissões por categoria de colaboradores no projeto
            </p>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/70 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <th className="px-5 py-3">Cargo do Funcionário (RH)</th>
                <th className="px-5 py-3">Perfil de Acesso (RBAC)</th>
                <th className="px-5 py-3 text-center">Regra de Login</th>
                <th className="px-5 py-3 text-center">Colaboradores</th>
                <th className="px-5 py-3 text-center">Usuários no Sistema</th>
                <th className="px-5 py-3 text-right">Permissões</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {(funcoes ?? []).map((f) => {
                const Icon = CARGO_ICONS[f.nome] ?? Briefcase;
                const perfilCorrespondente = perfis.find(
                  (p) => p.nome.toLowerCase() === f.nome.toLowerCase()
                );
                const countFunc = funcionarios.filter((emp) => emp.funcao === f.nome).length;
                const countUsers = perfilCorrespondente
                  ? usuarios.filter((u) => u.perfilId === perfilCorrespondente.id).length
                  : 0;

                const permiteLogin = f.permiteLogin ?? (f.nome !== "Staff");

                return (
                  <tr key={f.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100/70 text-sky-700 font-bold shrink-0">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900 text-sm">{f.nome}</p>
                          {f.descricao && <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{f.descricao}</p>}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {perfilCorrespondente ? (
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span className="font-bold text-zinc-800 text-xs">{perfilCorrespondente.nome}</span>
                        </div>
                      ) : (
                        <span className="text-xs italic text-zinc-400">Perfil não vinculado</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-center">
                      {permiteLogin ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-200">
                          <Key className="h-3 w-3" />
                          <span>Login Permitido</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-zinc-600 bg-zinc-100 px-2.5 py-1 rounded-full border border-zinc-200">
                          <Lock className="h-3 w-3" />
                          <span>Sem Acesso</span>
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <Badge tone={countFunc > 0 ? "sky" : "zinc"}>
                        {countFunc} colaborador(es)
                      </Badge>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <Badge tone={countUsers > 0 ? "green" : "zinc"}>
                        {countUsers} conta(s)
                      </Badge>
                    </td>

                    <td className="px-5 py-4 text-right">
                      {perfilCorrespondente ? (
                        <Link
                          href={`/configuracoes?aba=permissoes`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline"
                        >
                          <span>Ver Matriz RBAC</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      ) : (
                        <span className="text-xs text-zinc-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

"use client";

import Link from "next/link";
import { UserCog, MapPin } from "lucide-react";
import { Card, PageHeader } from "@/components/ui";
import { useQuery } from "@/lib/hooks/useQuery";
import { coordenadoresApi, type CoordenadorApi } from "@/lib/api/coordenadores";
import type { Paginated } from "@/lib/api/services";

export default function CoordenadoresPage() {
  const { data: pageData, loading } = useQuery<Paginated<CoordenadorApi>>(
    () => coordenadoresApi.list({ limit: 100 }),
    [],
  );
  const coordenadores = pageData?.data ?? [];

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="Coordenadores"
        description="Gerencie os coordenadores e seus núcleos de atuação"
      />

      {loading && <div className="py-12 text-center text-sm text-zinc-400">Carregando…</div>}

      {!loading && coordenadores.length === 0 && (
        <div className="py-12 text-center text-sm text-zinc-400">
          Nenhum coordenador encontrado. Atribua o perfil de coordenador a um funcionário.
        </div>
      )}

      {!loading && coordenadores.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coordenadores.map((coord) => (
            <Link key={coord.id} href={`/coordenadores/${coord.id}`}>
              <Card className="hover:border-sky-300 hover:shadow-sm transition-all cursor-pointer h-full">
                <div className="p-5 flex flex-col gap-4">
                  {/* Header do card */}
                  <div className="flex items-center gap-3">
                    {coord.fotoUrl ? (
                      <img
                        src={coord.fotoUrl}
                        alt={coord.nomeCompleto}
                        className="h-10 w-10 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 shrink-0">
                        <UserCog className="h-5 w-5 text-violet-600" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-zinc-800 truncate">{coord.nomeCompleto}</p>
                      {coord.email && (
                        <p className="text-xs text-zinc-400 truncate">{coord.email}</p>
                      )}
                    </div>
                  </div>

                  {/* Núcleos atribuídos */}
                  <div>
                    <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">
                      Núcleos atribuídos
                    </p>
                    {coord.nucleos.length === 0 ? (
                      <p className="text-xs text-zinc-300 italic">Nenhum núcleo atribuído</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {coord.nucleos.map((n) => (
                          <span
                            key={n.id}
                            className="inline-flex items-center gap-1 rounded-full bg-sky-50 border border-sky-200 px-2.5 py-0.5 text-xs font-medium text-sky-700"
                          >
                            <MapPin className="h-2.5 w-2.5" />
                            {n.identificacao}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

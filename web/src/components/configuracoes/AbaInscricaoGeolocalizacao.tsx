"use client";

import { useState, useEffect } from "react";
import { Button, Card, CardBody, CardHeader, Input, Select } from "@/components/ui";
import { MapPin, ShieldCheck, AlertTriangle, Info, CheckCircle2, Globe, Radio } from "lucide-react";
import { configuracoesApi } from "@/lib/api/services";
import {
  GEOLOCALIZACAO_DEFAULT_CONFIG,
  type GeolocalizacaoConfig,
} from "@/lib/geolocation";

export function AbaInscricaoGeolocalizacao() {
  const [config, setConfig] = useState<GeolocalizacaoConfig>(GEOLOCALIZACAO_DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    carregarConfiguracao();
  }, []);

  async function carregarConfiguracao() {
    setLoading(true);
    setErro(null);
    try {
      const res = await configuracoesApi.get("geolocalizacao_inscricao");
      if (res?.valor && typeof res.valor === "object") {
        setConfig({
          ...GEOLOCALIZACAO_DEFAULT_CONFIG,
          ...(res.valor as Partial<GeolocalizacaoConfig>),
        });
      }
    } catch {
      // Usa valor default se ainda não existir no banco
      setConfig(GEOLOCALIZACAO_DEFAULT_CONFIG);
    } finally {
      setLoading(false);
    }
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setMensagemSucesso(null);
    setErro(null);

    try {
      await configuracoesApi.upsert("geolocalizacao_inscricao", config, "Configuração global de validação geográfica para auto-inscrições públicas");
      setMensagemSucesso("Configurações de geolocalização salvas com sucesso!");
      setTimeout(() => setMensagemSucesso(null), 4000);
    } catch (err: any) {
      setErro(err.message || "Erro ao salvar configurações de geolocalização.");
    } finally {
      setSalvando(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-zinc-200 bg-white p-6">
        <p className="text-sm text-zinc-500 font-medium">Carregando configurações de geolocalização...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSalvar} className="flex flex-col gap-6">
      {mensagemSucesso && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm font-semibold text-emerald-800">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{mensagemSucesso}</span>
        </div>
      )}

      {erro && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-4 text-sm font-semibold text-red-800">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {/* Banner Informativo sobre Abrangência */}
      <div className="rounded-2xl border border-sky-200 bg-linear-to-r from-sky-50/80 to-white p-5 shadow-2xs">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-white shadow-2xs shrink-0">
            <Globe className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-zinc-900">
              Controle Territorial Global de Auto-Inscrições
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              As regras definidas nesta página são aplicadas automaticamente em <strong>todas as portas de entrada de inscrição</strong> do sistema: portal geral (<code>/inscricao</code>), links de polos (<code>/nucleo/[id]</code>) e links diretos/QR Code de turmas (<code>/turma/[id]</code>).
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="space-y-0.5">
            <h3 className="text-base font-bold text-zinc-900">Parâmetros de Validação por GPS</h3>
            <p className="text-xs text-zinc-500">Controle se o sistema deve verificar a localização do candidato antes de aceitar a matrícula</p>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          {/* Switch de Ativação */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-zinc-200 bg-zinc-50/50">
            <div className="space-y-0.5">
              <label className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-sky-600" />
                <span>Ativar Validação de Geolocalização</span>
              </label>
              <p className="text-xs text-zinc-500">
                Quando ativado, o navegador solicitará permissão de GPS para checar proximidade com o polo.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.ativo}
                onChange={(e) => setConfig({ ...config, ativo: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
            </label>
          </div>

          {config.ativo && (
            <div className="space-y-6 pt-2">
              {/* Nível de Restrição */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700">
                    Nível de Restrição Territorial
                  </label>
                  <Select
                    value={config.nivel}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        nivel: e.target.value as GeolocalizacaoConfig["nivel"],
                      })
                    }
                  >
                    <option value="cidade">Restringir à Cidade do Núcleo / Polo</option>
                    <option value="estado">Restringir ao Estado do Projeto (UF)</option>
                    <option value="raio_km">Raio Personalizado em Quilômetros (Km)</option>
                    <option value="desativado">Desativado</option>
                  </Select>
                  <p className="text-[11px] text-zinc-500">
                    Define qual critério geográfico o candidato precisa atender.
                  </p>
                </div>

                {config.nivel === "raio_km" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700">
                      Raio Máximo Permitido (em Km)
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={500}
                      value={config.raioKmMax}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          raioKmMax: Number(e.target.value) || 50,
                        })
                      }
                      placeholder="Ex: 50"
                    />
                    <p className="text-[11px] text-zinc-500">
                      Distância máxima em linha reta entre o candidato e o endereço do núcleo.
                    </p>
                  </div>
                )}
              </div>

              {/* Modo de Ação */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700">
                  Comportamento em Caso de Inconsistência
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      config.modo === "bloqueio"
                        ? "border-red-400 bg-red-50/40 shadow-xs ring-1 ring-red-400/20"
                        : "border-zinc-200 bg-white hover:bg-zinc-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="modo_geo"
                      value="bloqueio"
                      checked={config.modo === "bloqueio"}
                      onChange={() => setConfig({ ...config, modo: "bloqueio" })}
                      className="mt-1 text-red-600 focus:ring-red-500"
                    />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4 text-red-600" />
                        <span className="text-xs font-bold text-zinc-900">
                          Modo Estrito (Bloquear Inscrição)
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 leading-relaxed">
                        Impede o envio da ficha se o candidato estiver fora da área ou recusar o GPS.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      config.modo === "alerta_auditoria"
                        ? "border-sky-400 bg-sky-50/40 shadow-xs ring-1 ring-sky-400/20"
                        : "border-zinc-200 bg-white hover:bg-zinc-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="modo_geo"
                      value="alerta_auditoria"
                      checked={config.modo === "alerta_auditoria"}
                      onChange={() => setConfig({ ...config, modo: "alerta_auditoria" })}
                      className="mt-1 text-sky-600 focus:ring-sky-500"
                    />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <Info className="h-4 w-4 text-sky-600" />
                        <span className="text-xs font-bold text-zinc-900">
                          Modo Informativo / Auditoria
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 leading-relaxed">
                        Permite a inscrição registrando as coordenadas capturadas e sinalizando alerta para o gestor.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-zinc-100 pt-4 flex justify-end">
            <Button type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </div>
        </CardBody>
      </Card>
    </form>
  );
}

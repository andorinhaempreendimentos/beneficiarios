"use client";

import { useEffect, useState, useCallback } from "react";
import {
  MessageSquare,
  RefreshCw,
  QrCode,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Smartphone,
  Battery,
  Send,
  Save,
  PowerOff,
  RotateCcw,
  ShieldCheck,
  Server,
} from "lucide-react";
import { PageHeader, Card, Button, Input, Field, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { WhatsAppConfig, WhatsAppStatus, WhatsAppProviderType } from "@/lib/whatsapp/types";

export default function WhatsAppConfigPage() {
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSuccess, setConfigSuccess] = useState(false);
  const [configError, setConfigError] = useState("");

  const [config, setConfig] = useState<WhatsAppConfig>({
    provider: "zapi",
    zapi: {
      instanceId: "",
      token: "",
      clientToken: "",
      baseUrl: "https://api.z-api.io",
    },
    evolution: {
      baseUrl: "",
      apiKey: "",
      instanceName: "",
    },
  });

  // Status & Pareamento
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Teste de Envio
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("Mensagem de teste do sistema Andorinha via Z-API.");
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      setLoadingConfig(true);
      const res = await fetch("/api/whatsapp/config");
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (err: any) {
      console.error("Erro ao carregar configurações:", err);
    } finally {
      setLoadingConfig(false);
    }
  }, []);

  const checkStatus = useCallback(async () => {
    try {
      setCheckingStatus(true);
      const res = await fetch("/api/whatsapp/status");
      const data = await res.json();
      setStatus(data);
      if (data.connected) {
        setQrCode(null);
      }
    } catch (err: any) {
      setStatus({
        connected: false,
        provider: config.provider,
        error: err?.message || "Não foi possível conectar ao servidor",
      });
    } finally {
      setCheckingStatus(false);
    }
  }, [config.provider]);

  const loadQrCode = async () => {
    try {
      setLoadingQr(true);
      const res = await fetch("/api/whatsapp/qrcode");
      const data = await res.json();
      if (data.qrcode) {
        setQrCode(data.qrcode);
      } else if (data.error) {
        alert(`Erro ao gerar QR Code: ${data.error}`);
      }
    } catch (err: any) {
      alert("Erro ao buscar QR Code.");
    } finally {
      setLoadingQr(false);
    }
  };

  useEffect(() => {
    fetchConfig().then(() => {
      checkStatus();
    });
  }, [fetchConfig, checkStatus]);

  async function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault();
    setSavingConfig(true);
    setConfigSuccess(false);
    setConfigError("");

    try {
      const res = await fetch("/api/whatsapp/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Falha ao salvar configurações");
      }

      setConfigSuccess(true);
      setTimeout(() => setConfigSuccess(false), 3000);
      checkStatus();
    } catch (err: any) {
      setConfigError(err?.message || "Erro inesperado ao salvar");
    } finally {
      setSavingConfig(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm("Deseja realmente desconectar a sessão do WhatsApp?")) return;
    setActionLoading("disconnect");
    try {
      const res = await fetch("/api/whatsapp/disconnect", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        alert("Sessão desconectada!");
        checkStatus();
      } else {
        alert(`Falha: ${data.error || "Não foi possível desconectar"}`);
      }
    } catch (err: any) {
      alert(`Erro: ${err?.message}`);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRestart() {
    setActionLoading("restart");
    try {
      const res = await fetch("/api/whatsapp/restart", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        alert("Comando de reinicialização enviado com sucesso!");
        setTimeout(checkStatus, 3000);
      } else {
        alert(`Falha: ${data.error || "Erro ao reiniciar"}`);
      }
    } catch (err: any) {
      alert(`Erro: ${err?.message}`);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSendTest(e: React.FormEvent) {
    e.preventDefault();
    if (!testPhone) {
      alert("Informe o telefone para teste.");
      return;
    }

    setSendingTest(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/whatsapp/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: testPhone,
          message: testMessage,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTestResult({
          success: true,
          message: `Mensagem enviada com sucesso! ID: ${data.messageId || data.zaapId || "OK"}`,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || "Erro desconhecido ao enviar mensagem",
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || "Erro na comunicação ao enviar mensagem",
      });
    } finally {
      setSendingTest(false);
    }
  }

  const providers: { id: WhatsAppProviderType; label: string; desc: string; badge?: string }[] = [
    {
      id: "zapi",
      label: "Z-API",
      desc: "API Oficial Z-API em nuvem (Recomendado)",
      badge: "Ativo",
    },
    {
      id: "evolution",
      label: "Evolution API",
      desc: "API Open-source com múltiplas instâncias",
      badge: "Pronto p/ Ativar",
    },
    {
      id: "meta",
      label: "Meta Cloud API",
      desc: "API Direta do WhatsApp Business Cloud",
      badge: "Futuro",
    },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <PageHeader
        title="Configurações de WhatsApp"
        description="Gerenciamento do provedor de mensageria para envio automatizado de fichas, avisos e convites."
      />

      {/* Seleção de Provedor */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Server className="w-5 h-5 text-sky-600" />
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Provedor de Conexão</h2>
        </div>
        <p className="text-xs text-zinc-500 mb-4">
          Selecione a API utilizada para a comunicação. O sistema já está arquitetado para suportar múltiplos provedores.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {providers.map((p) => {
            const isSelected = config.provider === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setConfig((prev) => ({ ...prev, provider: p.id }))}
                className={cn(
                  "flex flex-col items-start p-4 rounded-xl border text-left transition-all cursor-pointer",
                  isSelected
                    ? "border-sky-600 bg-sky-50/60 dark:bg-sky-950/40 ring-2 ring-sky-500/20"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900"
                )}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{p.label}</span>
                  {p.badge && (
                    <span
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-semibold",
                        isSelected
                          ? "bg-sky-600 text-white"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                      )}
                    >
                      {p.badge}
                    </span>
                  )}
                </div>
                <span className="text-xs text-zinc-500">{p.desc}</span>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Painel de Credenciais */}
        <Card className="p-5 flex flex-col justify-between">
          <form onSubmit={handleSaveConfig} className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-sky-600" />
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Credenciais {config.provider === "zapi" ? "Z-API" : "Evolution API"}
                </h2>
              </div>
            </div>

            {config.provider === "zapi" ? (
              <div className="flex flex-col gap-3">
                <Field label="ID da Instância Z-API" required>
                  <Input
                    placeholder="Ex: 3B8C1D2E3F4G..."
                    value={config.zapi.instanceId}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        zapi: { ...prev.zapi, instanceId: e.target.value },
                      }))
                    }
                    required
                  />
                </Field>

                <Field label="Token da Instância" required>
                  <Input
                    type="password"
                    placeholder="Token fornecido no painel da Z-API"
                    value={config.zapi.token}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        zapi: { ...prev.zapi, token: e.target.value },
                      }))
                    }
                    required
                  />
                </Field>

                <Field label="Client Token de Segurança (Opcional)">
                  <Input
                    type="password"
                    placeholder="Caso sua conta utilize Client-Token de proteção"
                    value={config.zapi.clientToken || ""}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        zapi: { ...prev.zapi, clientToken: e.target.value },
                      }))
                    }
                  />
                </Field>

                <Field label="URL Base Z-API">
                  <Input
                    placeholder="https://api.z-api.io"
                    value={config.zapi.baseUrl || "https://api.z-api.io"}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        zapi: { ...prev.zapi, baseUrl: e.target.value },
                      }))
                    }
                  />
                </Field>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <Field label="URL do Servidor Evolution API" required>
                  <Input
                    placeholder="https://sua-evolution.com"
                    value={config.evolution?.baseUrl || ""}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        evolution: {
                          baseUrl: e.target.value,
                          apiKey: prev.evolution?.apiKey || "",
                          instanceName: prev.evolution?.instanceName || "",
                        },
                      }))
                    }
                  />
                </Field>

                <Field label="API Key Global" required>
                  <Input
                    type="password"
                    placeholder="Chave apikey"
                    value={config.evolution?.apiKey || ""}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        evolution: {
                          baseUrl: prev.evolution?.baseUrl || "",
                          apiKey: e.target.value,
                          instanceName: prev.evolution?.instanceName || "",
                        },
                      }))
                    }
                  />
                </Field>

                <Field label="Nome da Instância" required>
                  <Input
                    placeholder="Ex: andorinha-palmas"
                    value={config.evolution?.instanceName || ""}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        evolution: {
                          baseUrl: prev.evolution?.baseUrl || "",
                          apiKey: prev.evolution?.apiKey || "",
                          instanceName: e.target.value,
                        },
                      }))
                    }
                  />
                </Field>
              </div>
            )}

            {configSuccess && (
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Configurações salvas e validadas com sucesso!
              </div>
            )}

            {configError && (
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-lg border border-rose-200 dark:border-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                {configError}
              </div>
            )}

            <div className="pt-2">
              <Button type="submit" disabled={savingConfig || loadingConfig} className="w-full justify-center">
                <Save className="w-4 h-4 mr-2" />
                {savingConfig ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </div>
          </form>
        </Card>

        {/* Status da Conexão & Pareamento */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-sky-600" />
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Status da Instância</h2>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={checkStatus}
                disabled={checkingStatus}
                className="h-8"
              >
                <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", checkingStatus && "animate-spin")} />
                Atualizar
              </Button>
            </div>

            {/* Badge de Status Principal */}
            <div className="flex items-center gap-3 p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 mb-4">
              {status?.connected ? (
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              ) : (
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600">
                  <XCircle className="w-6 h-6" />
                </div>
              )}

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {status?.connected ? "Conectado e Operacional" : "Desconectado ou Não Configurado"}
                  </span>
                  <Badge tone={status?.connected ? "green" : "red"}>
                    {status?.connected ? "Online" : "Offline"}
                  </Badge>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Provedor ativo: <strong className="uppercase">{status?.provider || config.provider}</strong>
                </p>
              </div>
            </div>

            {/* Detalhes do Dispositivo (quando conectado) */}
            {status?.connected ? (
              <div className="space-y-3 p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs">
                {status.phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Número Conectado:</span>
                    <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">+{status.phone}</span>
                  </div>
                )}
                {status.profileName && (
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Nome do Aparelho:</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{status.profileName}</span>
                  </div>
                )}
                {typeof status.batteryLevel === "number" && (
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 flex items-center gap-1">
                      <Battery className="w-4 h-4 text-emerald-500" /> Bateria:
                    </span>
                    <span className="font-bold text-emerald-600">{status.batteryLevel}%</span>
                  </div>
                )}

                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 text-rose-600 hover:text-rose-700"
                    onClick={handleDisconnect}
                    disabled={actionLoading !== null}
                  >
                    <PowerOff className="w-3.5 h-3.5 mr-1" />
                    Desconectar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={handleRestart}
                    disabled={actionLoading !== null}
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" />
                    Reiniciar
                  </Button>
                </div>
              </div>
            ) : (
              /* QR Code para Pareamento (quando desconectado) */
              <div className="flex flex-col items-center justify-center p-4 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900">
                {qrCode ? (
                  <div className="flex flex-col items-center gap-3">
                    <img
                      src={qrCode}
                      alt="QR Code WhatsApp"
                      className="w-48 h-48 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700"
                    />
                    <p className="text-xs text-zinc-500 text-center max-w-xs">
                      Abra o WhatsApp no aparelho &gt; Dispositivos conectados &gt; Conectar dispositivo e aponte para a tela.
                    </p>
                    <Button type="button" variant="outline" size="sm" onClick={loadQrCode} disabled={loadingQr}>
                      <RefreshCw className={cn("w-3.5 h-3.5 mr-1", loadingQr && "animate-spin")} />
                      Atualizar QR Code
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <QrCode className="w-12 h-12 text-zinc-400" />
                    <p className="text-xs text-zinc-500 text-center max-w-xs">
                      {status?.error
                        ? status.error
                        : "Salve as credenciais e clique abaixo para gerar o QR Code de pareamento."}
                    </p>
                    <Button type="button" onClick={loadQrCode} disabled={loadingQr} className="mt-2">
                      <QrCode className="w-4 h-4 mr-2" />
                      {loadingQr ? "Gerando..." : "Gerar QR Code"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Seção de Teste de Envio */}
      <Card className="p-5">
        <form onSubmit={handleSendTest} className="flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <MessageSquare className="w-5 h-5 text-sky-600" />
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Teste de Disparo Real</h2>
              <p className="text-xs text-zinc-500">Envie uma mensagem direta de teste para validar o funcionamento do gateway.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Field label="Telefone Destino (com DDD)" required>
                <Input
                  placeholder="Ex: 63999998888 ou 5563999998888"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  required
                />
              </Field>
            </div>

            <div className="md:col-span-2">
              <Field label="Mensagem de Teste" required>
                <Input
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  required
                />
              </Field>
            </div>
          </div>

          {testResult && (
            <div
              className={cn(
                "flex items-center gap-2 p-3 rounded-lg text-xs font-semibold border",
                testResult.success
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                  : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800"
              )}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={sendingTest || !status?.connected}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              {sendingTest ? "Enviando..." : "Enviar Mensagem de Teste"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

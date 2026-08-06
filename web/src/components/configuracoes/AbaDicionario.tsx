"use client";

import { useState } from "react";
import { Button, Card, CardBody, CardHeader, Field, Input } from "@/components/ui";
import { useDicionario } from "@/components/providers/DictionaryProvider";

export function AbaDicionario() {
  const { termosList, setTermo, restaurarTermo, salvarDicionario, salvando } = useDicionario();
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSalvar() {
    setMensagem(null);
    setErro(null);
    try {
      await salvarDicionario();
      setMensagem("Dicionário de termos salvo com sucesso!");
    } catch (err: any) {
      setErro(err.message || "Erro ao salvar dicionário.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {mensagem && (
        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
          {mensagem}
        </div>
      )}
      {erro && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {erro}
        </div>
      )}

      <Card>
        <CardHeader>
          <h3 className="text-sm font-medium text-zinc-700">Dicionário de Termos</h3>
          <p className="mt-1 text-xs text-zinc-400">
            Personalize os rótulos exibidos em toda a interface sem alterar a lógica interna do sistema.
          </p>
        </CardHeader>
        <CardBody>
          <div className="divide-y divide-zinc-100">
            {termosList.map((t) => (
              <div key={t.conceito} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:gap-6">
                <div className="w-36 shrink-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                    Conceito interno
                  </p>
                  <p className="mt-0.5 text-sm font-mono text-zinc-600">{t.conceito}</p>
                </div>
                <div className="flex flex-1 items-center gap-3">
                  <Field label="Label exibido" className="flex-1">
                    <Input
                      value={t.labelAtual}
                      onChange={(e) => setTermo(t.conceito, e.target.value)}
                    />
                  </Field>
                  {t.labelAtual !== t.padrao && (
                    <button
                      type="button"
                      onClick={() => restaurarTermo(t.conceito)}
                      className="mt-5 shrink-0 text-xs text-zinc-400 hover:text-zinc-700"
                    >
                      Restaurar padrão
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
        <div className="border-t border-zinc-200 px-5 py-3 flex justify-end">
          <Button size="sm" onClick={handleSalvar} disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar dicionário"}
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-sm font-medium text-zinc-700">Prévia</h3>
          <p className="mt-1 text-xs text-zinc-400">Como os termos aparecem nos menus e títulos.</p>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap gap-2">
            {termosList.map((t) => (
              <span key={t.conceito} className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm text-zinc-700">
                {t.labelAtual}
              </span>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

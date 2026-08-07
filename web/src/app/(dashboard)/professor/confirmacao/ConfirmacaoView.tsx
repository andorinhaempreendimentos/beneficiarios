"use client";

import { useState } from "react";
import { Camera, CheckCircle2, MapPin } from "lucide-react";
import { Button, Card, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { useToast } from "@/components/providers/ToastProvider";
import type { FuncionarioApi } from "@/lib/api/services";

export function ConfirmacaoView({ professor }: { professor?: FuncionarioApi }) {
  const { toast } = useToast();
  const [atividadeExecutada, setAtividadeExecutada] = useState("");
  const [observacoesAula, setObservacoesAula] = useState("");
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setFotoPreview(URL.createObjectURL(file));
    }
  }

  function handleEnviar(e: React.FormEvent) {
    e.preventDefault();
    if (!atividadeExecutada) {
      toast.error("Por favor, descreva a atividade executada.");
      return;
    }
    setEnviado(true);
    toast.success("Confirmação de serviço e relatório fotográfico enviados!");
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto py-2">
      <PageHeader
        title="Verificação & Confirmação de Atividade"
        description="Relatório de comprovação de aulas ministradas e registro fotográfico de campo"
      />

      <Card className="p-6">
        <form onSubmit={handleEnviar} className="flex flex-col gap-5">
          <Field label="Descrição da Aula / Treino Executado" required>
            <Input
              placeholder="Ex: Treino de fundamentos de passe e condução de bola"
              value={atividadeExecutada}
              onChange={(e) => setAtividadeExecutada(e.target.value)}
            />
          </Field>

          <Field label="Foto de Comprovação da Aula (Upload ou Câmera)">
            <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 p-6 text-center hover:bg-zinc-50 transition-colors">
              {fotoPreview ? (
                <div className="flex flex-col items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={fotoPreview} alt="Comprovação" className="h-48 rounded-xl object-cover" />
                  <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" /> Foto anexada com sucesso
                  </span>
                </div>
              ) : (
                <>
                  <Camera className="h-8 w-8 text-zinc-400 mb-2" />
                  <span className="text-sm font-semibold text-zinc-700">Anexar Foto da Aula</span>
                  <span className="text-xs text-zinc-400 mt-0.5">Selecione uma imagem ou tire uma foto com a câmera</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFoto}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </Field>

          <Field label="Observações de Campo / Ocorrências">
            <Textarea
              placeholder="Informe se houve alguma intercorrência, material danificado ou observação sobre os alunos..."
              value={observacoesAula}
              onChange={(e) => setObservacoesAula(e.target.value)}
              rows={3}
            />
          </Field>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={enviado}>
              {enviado ? "Relatório Enviado ✓" : "Enviar Relatório de Serviço"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

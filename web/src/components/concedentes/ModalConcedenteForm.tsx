"use client";

import { useState, useEffect } from "react";
import { Button, Field, Input, Select } from "@/components/ui";
import { concedentesApi, type ConcedenteApi } from "@/lib/api/services";
import { X, Building2 } from "lucide-react";

interface ModalConcedenteFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (concedente: ConcedenteApi) => void;
  concedenteParaEditar?: ConcedenteApi | null;
}

export function ModalConcedenteForm({
  isOpen,
  onClose,
  onSuccess,
  concedenteParaEditar,
}: ModalConcedenteFormProps) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [esfera, setEsfera] = useState<"municipal" | "estadual" | "federal">("municipal");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [responsavelNome, setResponsavelNome] = useState("");
  const [responsavelCargo, setResponsavelCargo] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (concedenteParaEditar) {
      setNome(concedenteParaEditar.nome || "");
      setCnpj(concedenteParaEditar.cnpj || "");
      setEsfera(concedenteParaEditar.esfera || "municipal");
      setCidade(concedenteParaEditar.cidade || "");
      setEstado(concedenteParaEditar.estado || "");
      setResponsavelNome(concedenteParaEditar.responsavelNome || "");
      setResponsavelCargo(concedenteParaEditar.responsavelCargo || "");
      setTelefone(concedenteParaEditar.telefone || "");
      setEmail(concedenteParaEditar.email || "");
    } else {
      setNome("");
      setCnpj("");
      setEsfera("municipal");
      setCidade("");
      setEstado("");
      setResponsavelNome("");
      setResponsavelCargo("");
      setTelefone("");
      setEmail("");
    }
    setErro(null);
  }, [concedenteParaEditar, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) {
      setErro("Nome do órgão concedente é obrigatório.");
      return;
    }

    setLoading(true);
    setErro(null);

    const payload: Partial<ConcedenteApi> = {
      nome: nome.trim(),
      cnpj: cnpj.trim() || undefined,
      esfera,
      cidade: cidade.trim() || undefined,
      estado: estado.trim() || undefined,
      responsavelNome: responsavelNome.trim() || undefined,
      responsavelCargo: responsavelCargo.trim() || undefined,
      telefone: telefone.trim() || undefined,
      email: email.trim() || undefined,
    };

    try {
      let resultado: ConcedenteApi;
      if (concedenteParaEditar?.id) {
        resultado = await concedentesApi.update(concedenteParaEditar.id, payload);
      } else {
        resultado = await concedentesApi.create(payload);
      }
      onSuccess(resultado);
      onClose();
    } catch (err: any) {
      setErro(err.message || "Erro ao salvar órgão concedente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex w-full max-w-xl flex-col rounded-xl bg-white shadow-xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 bg-zinc-50/50">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-sky-600" />
            <h3 className="text-base font-bold text-zinc-900">
              {concedenteParaEditar ? "Editar Órgão Concedente" : "Cadastrar Novo Órgão Concedente"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {erro && (
            <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-700">
              {erro}
            </div>
          )}

          <Field label="Nome do Órgão Concedente (Poder Público)" required>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Secretaria Municipal de Juventude e Esportes – SEJUVES"
              required
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="CNPJ do Órgão">
              <Input
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                placeholder="Ex: 00.000.000/0001-00"
              />
            </Field>

            <Field label="Esfera Administrativa" required>
              <Select
                value={esfera}
                onChange={(e) => setEsfera(e.target.value as "municipal" | "estadual" | "federal")}
              >
                <option value="municipal">Municipal</option>
                <option value="estadual">Estadual</option>
                <option value="federal">Federal</option>
              </Select>
            </Field>

            <Field label="Cidade">
              <Input
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                placeholder="Ex: Palmas"
              />
            </Field>

            <Field label="Estado (UF)">
              <Input
                value={estado}
                onChange={(e) => setEstado(e.target.value.toUpperCase())}
                placeholder="Ex: TO"
                maxLength={2}
              />
            </Field>

            <Field label="Nome do Responsável / Titular">
              <Input
                value={responsavelNome}
                onChange={(e) => setResponsavelNome(e.target.value)}
                placeholder="Ex: Secretário(a) Municipal"
              />
            </Field>

            <Field label="Cargo do Responsável">
              <Input
                value={responsavelCargo}
                onChange={(e) => setResponsavelCargo(e.target.value)}
                placeholder="Ex: Secretário Municipal de Esportes"
              />
            </Field>

            <Field label="Telefone de Contato">
              <Input
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="Ex: (63) 3212-0000"
              />
            </Field>

            <Field label="E-mail Institucional">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: esporte@palmas.to.gov.br"
              />
            </Field>
          </div>

          <div className="border-t border-zinc-100 pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? "Salvando..." : concedenteParaEditar ? "Salvar Alterações" : "Cadastrar Concedente"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

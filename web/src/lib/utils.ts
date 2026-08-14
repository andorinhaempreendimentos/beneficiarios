import { clsx, type ClassValue } from "clsx";

/** Combina classes CSS com suporte a utilitários condicionais. */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function calcularIdade(dataNascimento: string): number {
  const nascimento = new Date(dataNascimento);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const aindaNaoFezAniversario =
    hoje.getMonth() < nascimento.getMonth() ||
    (hoje.getMonth() === nascimento.getMonth() &&
      hoje.getDate() < nascimento.getDate());
  if (aindaNaoFezAniversario) idade--;
  return idade;
}

export function formatarData(data: string | Date | null | undefined, incluirHora = false): string {
  if (!data) return "";
  const d = typeof data === "string" ? new Date(data) : data;
  if (isNaN(d.getTime())) {
    // Fallback caso venha string YYYY-MM-DD pura sem parse ISO
    const parts = String(data).split("T")[0].split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return String(data);
  }
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const ano = d.getFullYear();
  if (incluirHora) {
    const horas = String(d.getHours()).padStart(2, "0");
    const minutos = String(d.getMinutes()).padStart(2, "0");
    return `${dia}/${mes}/${ano} às ${horas}:${minutos}`;
  }
  return `${dia}/${mes}/${ano}`;
}

export function formatarCpf(cpf: string): string {
  const digitos = cpf.replace(/\D/g, "");
  return digitos.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export function formatarTelefone(telefone: string): string {
  const digitos = telefone.replace(/\D/g, "");
  if (digitos.length === 11) {
    return digitos.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  return digitos.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
}

/**
 * Utilitários de Máscaras e Validações do Sistema
 */

// ── Máscaras de Entrada ───────────────────────────────────────────────────

export function mascararCpf(val: string): string {
  const v = val.replace(/\D/g, "").slice(0, 11);
  return v
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function mascararCnpj(val: string): string {
  const v = val.replace(/\D/g, "").slice(0, 14);
  return v
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function mascararCpfCnpj(val: string): string {
  const clean = val.replace(/\D/g, "");
  if (clean.length > 11) return mascararCnpj(val);
  return mascararCpf(val);
}

export function mascararTelefone(val: string): string {
  const v = val.replace(/\D/g, "").slice(0, 11);
  if (v.length > 10) {
    return v.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  }
  return v
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function mascararCep(val: string): string {
  const v = val.replace(/\D/g, "").slice(0, 8);
  return v.replace(/^(\d{5})(\d)/, "$1-$2");
}

export function apenasNumeros(val: string): string {
  return val.replace(/\D/g, "");
}

// ── Funções de Validação ──────────────────────────────────────────────────

/**
 * Validação rigorosa de Email (exige no mínimo termo1@termo2.termo3)
 */
export function validarEmail(email: string): boolean {
  if (!email) return false;
  // Expressão regular que valida termo1 @ termo2 . termo3
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
}

/**
 * Validação matemática de CPF (Dígitos verificadores)
 */
export function validarCpf(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(clean)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(clean.charAt(i)) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(clean.charAt(9))) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(clean.charAt(i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(clean.charAt(10))) return false;

  return true;
}

/**
 * Validação matemática de CNPJ (Dígitos verificadores)
 */
export function validarCnpj(cnpj: string): boolean {
  const clean = cnpj.replace(/\D/g, "");
  if (clean.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(clean)) return false;

  let tamanho = clean.length - 2;
  let numeros = clean.substring(0, tamanho);
  const digitos = clean.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) return false;

  tamanho = tamanho + 1;
  numeros = clean.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(1))) return false;

  return true;
}

/**
 * Validação de CEP (exatamente 8 dígitos numéricos)
 */
export function validarCep(cep: string): boolean {
  const clean = cep.replace(/\D/g, "");
  return clean.length === 8;
}

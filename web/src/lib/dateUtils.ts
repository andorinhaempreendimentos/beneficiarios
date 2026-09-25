/**
 * Utilitários de data e hora para fuso horário de Brasília (America/Sao_Paulo - UTC-3)
 */

export function getDataHojeBrasil(): string {
  return formatDateBrasil(new Date());
}

/** Formata qualquer objeto Date como YYYY-MM-DD no fuso de Brasília */
export function formatDateBrasil(date: Date): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}

export function getHoraAgoraBrasil(): string {
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return formatter.format(new Date());
}

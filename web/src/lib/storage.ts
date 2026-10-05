/**
 * Utilitário central para formatação de URLs de arquivos e comprovantes.
 * Garante que caminhos salvos no banco sejam roteados pela API autenticada,
 * preservando a segurança de buckets privados.
 */
export function formatStorageUrl(pathOrUrl?: string): string {
  if (!pathOrUrl) return "";

  // Manter previews locais em tempo real (camera / upload em andamento)
  if (pathOrUrl.startsWith("data:") || pathOrUrl.startsWith("blob:")) {
    return pathOrUrl;
  }

  // Se já for a rota de storage autenticada
  if (pathOrUrl.startsWith("/api/storage/comprovacoes")) {
    return pathOrUrl;
  }

  // Normalizar caminhos que vierem como URLs completas antigas do Supabase
  let cleanPath = pathOrUrl;
  if (cleanPath.includes("/storage/v1/object/public/comprovacoes/")) {
    cleanPath = cleanPath.split("/storage/v1/object/public/comprovacoes/")[1];
  } else if (cleanPath.includes("/storage/v1/object/sign/comprovacoes/")) {
    cleanPath = cleanPath.split("/storage/v1/object/sign/comprovacoes/")[1].split("?")[0];
  } else if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) {
    // Links externos que não pertençam ao bucket de comprovacoes
    return cleanPath;
  }

  // Limpar barra inicial se houver
  if (cleanPath.startsWith("/")) {
    cleanPath = cleanPath.substring(1);
  }

  return `/api/storage/comprovacoes?path=${encodeURIComponent(cleanPath)}`;
}

/**
 * Utilitário para busca paginada em lotes no Supabase / PostgREST.
 * Contorna o limite padrão de 1.000 registros por query (pgrst.db_max_rows).
 */
export async function fetchAllInBatches<T>(
  queryFactory: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: any }>,
  batchSize: number = 1000
): Promise<T[]> {
  let allRows: T[] = [];
  let page = 0;

  while (true) {
    const from = page * batchSize;
    const to = from + batchSize - 1;
    const { data, error } = await queryFactory(from, to);

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      break;
    }

    allRows = allRows.concat(data);

    if (data.length < batchSize) {
      break;
    }

    page++;
  }

  return allRows;
}

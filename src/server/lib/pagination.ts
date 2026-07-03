export function parsePagination(
  query: Record<string, unknown>,
  defaultLimit = 20,
  maxLimit = 50
): { page: number; limit: number; skip: number } {
  const page = Math.max(1, parseInt(String(query.page ?? "1"), 10) || 1);
  const rawLimit = parseInt(String(query.limit ?? String(defaultLimit)), 10);
  const limit = Math.min(
    maxLimit,
    Math.max(1, Number.isFinite(rawLimit) ? rawLimit : defaultLimit)
  );
  return { page, limit, skip: (page - 1) * limit };
}

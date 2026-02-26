/** Escape ILIKE special characters for safe use in SQL LIKE/ILIKE patterns */
export function escapeIlike(str: string): string {
  return str.replace(/[%_\\]/g, (ch) => "\\" + ch);
}

/** Shared pagination defaults */
export function paginationDefaults(params?: { page?: number; limit?: number }) {
  const page = Math.max(1, params?.page ?? 1);
  const limit = Math.min(Math.max(1, params?.limit ?? 20), 100);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

/** Calculate total pages from total count and limit */
export function totalPages(total: number, limit: number): number {
  return Math.ceil(total / limit);
}

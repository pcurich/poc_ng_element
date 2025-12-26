/**
 * 📋 Repository Types - Query and Pagination Types
 * 
 * Tipos compartidos para operaciones de consulta y paginación
 * en el patrón Repository.
 */

/**
 * 📋 Query Options para operaciones de consulta
 */
export interface IQueryOptions<T = any> {
  filter?: Partial<T> | ((item: T) => boolean);
  sortBy?: keyof T;
  sortDirection?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  include?: string[]; // Para relaciones futuras
}

/**
 * 📊 Resultado paginado
 */
export interface IPaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
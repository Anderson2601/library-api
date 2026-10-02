import { BadRequestError } from "../errors/AppError";

/** Parámetros de paginación ya calculados. skip = cuántos registros saltar en Mongo. */
export interface PageParams {
    page: number;
    limit: number;
    skip: number;
}

/** Forma de respuesta de todos los listados. */
export interface Paginated<T> {
    data: T[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

const DEFAULT_LIMIT = 10; // registros por página si no se indica
const MAX_LIMIT = 100;    // tope para evitar consultas gigantes

/** Lee un entero positivo del query string; si no viene usa el valor por defecto. */
const parsePositiveInt = (value: unknown, field: string, fallback: number): number => {
    if (value === undefined) return fallback;
    const n = typeof value === "string" ? Number(value) : NaN;
    if (!Number.isInteger(n) || n < 1) {
        throw new BadRequestError(`El parámetro '${field}' debe ser un entero positivo`);
    }
    return n;
};

/** Convierte ?page=2&limit=5 en { page, limit, skip }. */
export const parsePagination = (query: Record<string, unknown>): PageParams => {
    const page = parsePositiveInt(query.page, "page", 1);
    const limit = Math.min(parsePositiveInt(query.limit, "limit", DEFAULT_LIMIT), MAX_LIMIT);
    return { page, limit, skip: (page - 1) * limit };
};

/** Arma la respuesta paginada estándar. */
export const buildPaginated = <T>(data: T[], total: number, { page, limit }: PageParams): Paginated<T> => ({
    data,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
});

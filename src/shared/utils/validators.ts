import { ObjectId } from "mongodb";
import { BadRequestError } from "../errors/AppError";

/**
 * Funciones de validación reutilizables. Las usan los SERVICIOS para
 * comprobar los datos que llegan del cliente (req.body / req.query / req.params).
 * Si un dato no es válido lanzan BadRequestError (HTTP 400).
 */

// Un ObjectId de Mongo son exactamente 24 caracteres hexadecimales.
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

/** Exige un texto no vacío y lo devuelve sin espacios sobrantes. */
export const requireString = (value: unknown, field: string): string => {
    if (typeof value !== "string" || value.trim() === "") {
        throw new BadRequestError(`El campo '${field}' es obligatorio y debe ser un texto no vacío`);
    }
    return value.trim();
};

/** Convierte un string en ObjectId, verificando que tenga formato válido. */
export const toObjectId = (value: unknown, field = "id"): ObjectId => {
    if (typeof value !== "string" || !OBJECT_ID_REGEX.test(value)) {
        throw new BadRequestError(`El campo '${field}' no es un identificador válido`);
    }
    return new ObjectId(value);
};

/** Exige un número entero. Con mustBePositive también exige que sea mayor que 0. */
export const parseInteger = (value: unknown, field: string, mustBePositive = false): number => {
    if (typeof value !== "number" || !Number.isInteger(value)) {
        throw new BadRequestError(`El campo '${field}' debe ser un número entero`);
    }
    if (mustBePositive && value <= 0) {
        throw new BadRequestError(`El campo '${field}' debe ser un entero positivo`);
    }
    return value;
};

/** Exige un booleano real (true/false), no un texto. */
export const parseBoolean = (value: unknown, field: string): boolean => {
    if (typeof value !== "boolean") {
        throw new BadRequestError(`El campo '${field}' debe ser booleano (true/false)`);
    }
    return value;
};

/** Convierte un texto ISO (ej. "2025-05-20") o timestamp en Date, verificando que sea una fecha real. */
export const parseDate = (value: unknown, field: string): Date => {
    if (typeof value !== "string" && typeof value !== "number") {
        throw new BadRequestError(`El campo '${field}' debe ser una fecha válida (ej. 2025-05-20)`);
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        throw new BadRequestError(`El campo '${field}' debe ser una fecha válida (ej. 2025-05-20)`);
    }
    return date;
};

/**
 * Lee un filtro booleano de la URL (?available=true). En la URL todo llega como texto,
 * por eso solo se aceptan los textos "true" y "false". Si no viene, devuelve undefined.
 */
export const parseBooleanQuery = (value: unknown, field: string): boolean | undefined => {
    if (value === undefined) return undefined;
    if (value === "true") return true;
    if (value === "false") return false;
    throw new BadRequestError(`El parámetro '${field}' debe ser 'true' o 'false'`);
};

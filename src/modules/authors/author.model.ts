import { ObjectId } from "mongodb";

/** Documento tal como se guarda en la colección "authors". */
export interface Author {
    _id?: ObjectId;
    name: string;
    nationality: string;
    birthYear?: number; // opcional
    createdAt: Date;    // se asigna al crear
    updatedAt: Date;    // se renueva en cada actualización
}

/**
 * Datos que el cliente puede enviar. Todo es opcional a nivel de tipo;
 * el servicio decide qué es obligatorio según la operación (crear vs. actualizar).
 */
export interface AuthorDTO {
    name?: string;
    nationality?: string;
    birthYear?: number;
}

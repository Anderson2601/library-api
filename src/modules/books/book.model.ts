import { ObjectId } from "mongodb";

/** Documento tal como se guarda en la colección "books". */
export interface Book {
    _id?: ObjectId;
    title: string;
    isbn: string;        // único (índice único en Mongo + verificación en el servicio)
    authorId: ObjectId;  // RELACIÓN: referencia a un documento de "authors"
    year?: number;       // opcional
    available: boolean;  // true = se puede prestar
    createdAt: Date;
    updatedAt: Date;
}

/** Datos que el cliente puede enviar (authorId llega como texto y se convierte a ObjectId en el servicio). */
export interface BookDTO {
    title?: string;
    isbn?: string;
    authorId?: string;
    year?: number;
    available?: boolean;
}

/** Filtros opcionales para listar libros (extra: ?available=true&authorId=...). */
export interface BookFilters {
    authorId?: ObjectId;
    available?: boolean;
}

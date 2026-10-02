import { ObjectId } from "mongodb";

/** Documento tal como se guarda en la colección "loans". */
export interface Loan {
    _id?: ObjectId;
    bookId: ObjectId;     // RELACIÓN: libro prestado
    userName: string;     // persona que se lleva el libro
    loanDate: Date;       // fecha del préstamo
    returnDate?: Date;    // se llena al devolver
    returned: boolean;    // false mientras el libro siga prestado
    createdAt: Date;
    updatedAt: Date;
}

/** Datos que el cliente puede enviar (las fechas llegan como texto ISO). */
export interface LoanDTO {
    bookId?: string;
    userName?: string;
    loanDate?: string;
    returnDate?: string;
    returned?: boolean;
}

/** Filtros opcionales del listado (?returned=false&bookId=...). */
export interface LoanFilters {
    returned?: boolean;
    bookId?: ObjectId;
}

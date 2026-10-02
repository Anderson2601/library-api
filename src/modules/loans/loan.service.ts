import { Loan, LoanDTO, LoanFilters } from "./loan.model";
import { LoanRepository } from "./loan.repository";
import { BookRepository } from "../books/book.repository";
import { BadRequestError, ConflictError, NotFoundError } from "../../shared/errors/AppError";
import {
    parseBooleanQuery,
    parseDate,
    requireString,
    toObjectId,
} from "../../shared/utils/validators";
import { buildPaginated, Paginated, parsePagination } from "../../shared/utils/pagination";

/**
 * CAPA SERVICIO de préstamos. Aquí están las reglas más importantes:
 *  - Crear un préstamo exige que el libro exista y esté disponible, y lo deja no disponible.
 *  - Devolver un préstamo asigna returnDate y libera el libro.
 */
export class LoanService {

    private readonly loanRepository = new LoanRepository();
    private readonly bookRepository = new BookRepository();

    /**
     * Registra un préstamo.
     * RELACIÓN: el bookId debe existir.
     * REGLA (Libros): el libro debe estar available:true; al prestarlo pasa a available:false.
     */
    async create(data: LoanDTO): Promise<Loan> {
        const body = data ?? {};

        // 1) Validar los datos de entrada antes de tocar la base de datos
        const bookId = toObjectId(body.bookId, "bookId");
        const userName = requireString(body.userName, "userName");
        const loanDate = parseDate(body.loanDate, "loanDate");

        // 2) Validar la relación: el libro debe existir
        const book = await this.bookRepository.findById(bookId);
        if (!book) {
            throw new NotFoundError("El libro indicado (bookId) no existe");
        }

        // 3) Reservar el libro de forma atómica (solo si sigue disponible)
        const reserved = await this.bookRepository.markUnavailableIfAvailable(bookId);
        if (!reserved) {
            throw new ConflictError("El libro no está disponible para préstamo");
        }

        // 4) Guardar el préstamo. Si falla, se devuelve el libro a disponible (se revierte el paso 3).
        const now = new Date();
        try {
            return await this.loanRepository.create({
                bookId,
                userName,
                loanDate,
                returned: false, // un préstamo nuevo siempre nace sin devolver
                createdAt: now,
                updatedAt: now,
            });
        } catch (error) {
            await this.bookRepository.setAvailable(bookId, true);
            throw error;
        }
    }

    /** Lista paginada con filtros opcionales (?returned=false&bookId=...). */
    async findAll(query: Record<string, unknown>): Promise<Paginated<Loan>> {
        const pagination = parsePagination(query);
        const filters: LoanFilters = {
            returned: parseBooleanQuery(query.returned, "returned"),
            bookId: query.bookId !== undefined ? toObjectId(query.bookId, "bookId") : undefined,
        };
        const [data, total] = await Promise.all([
            this.loanRepository.findAll(filters, pagination.skip, pagination.limit),
            this.loanRepository.count(filters),
        ]);
        return buildPaginated(data, total, pagination);
    }

    /** EXTRA: préstamos activos (returned:false). Reutiliza findAll forzando el filtro. */
    async findActive(query: Record<string, unknown>): Promise<Paginated<Loan>> {
        return this.findAll({ ...query, returned: "false" });
    }

    async findById(id: string): Promise<Loan> {
        const loan = await this.loanRepository.findById(toObjectId(id));
        if (!loan) {
            throw new NotFoundError("Préstamo no encontrado");
        }
        return loan;
    }

    /**
     * Actualiza un préstamo o lo marca como devuelto.
     * REGLA (Préstamos): al enviar returned:true se asigna returnDate
     * (la enviada o, por defecto, la fecha actual) y el libro vuelve a available:true.
     */
    async update(id: string, data: LoanDTO): Promise<Loan> {
        const objectId = toObjectId(id);
        const body = data ?? {};

        const loan = await this.loanRepository.findById(objectId);
        if (!loan) {
            throw new NotFoundError("Préstamo no encontrado");
        }

        // El libro de un préstamo no se puede cambiar (rompería la coherencia de disponibilidad)
        if (body.bookId !== undefined) {
            throw new BadRequestError("El libro de un préstamo no puede modificarse");
        }
        // Un préstamo devuelto queda cerrado
        if (loan.returned) {
            throw new ConflictError("El préstamo ya fue devuelto y no puede modificarse");
        }

        const changes: Partial<Loan> = {};
        if (body.userName !== undefined) changes.userName = requireString(body.userName, "userName");
        if (body.loanDate !== undefined) changes.loanDate = parseDate(body.loanDate, "loanDate");

        // --- Devolución ---
        let isReturning = false;
        if (body.returned !== undefined) {
            if (typeof body.returned !== "boolean") {
                throw new BadRequestError("El campo 'returned' debe ser booleano (true/false)");
            }
            isReturning = body.returned;
        }
        if (body.returnDate !== undefined && !isReturning) {
            throw new BadRequestError("'returnDate' solo puede enviarse junto con returned:true");
        }
        if (isReturning) {
            const returnDate = body.returnDate !== undefined ? parseDate(body.returnDate, "returnDate") : new Date();
            const effectiveLoanDate = changes.loanDate ?? loan.loanDate;
            if (returnDate < effectiveLoanDate) {
                throw new BadRequestError("La fecha de devolución no puede ser anterior a la fecha del préstamo");
            }
            changes.returned = true;
            changes.returnDate = returnDate;
        }

        if (Object.keys(changes).length === 0) {
            throw new BadRequestError("No se enviaron campos para actualizar");
        }
        changes.updatedAt = new Date();

        const updated = await this.loanRepository.update(objectId, changes);
        if (!updated) {
            throw new NotFoundError("Préstamo no encontrado");
        }

        // El libro vuelve a estar disponible al devolverlo
        if (isReturning) {
            await this.bookRepository.setAvailable(loan.bookId, true);
        }
        return updated;
    }

    /**
     * Elimina un préstamo. Si todavía estaba activo (sin devolver), primero se libera
     * el libro para que no quede marcado como no disponible para siempre.
     */
    async delete(id: string): Promise<void> {
        const objectId = toObjectId(id);

        const loan = await this.loanRepository.findById(objectId);
        if (!loan) {
            throw new NotFoundError("Préstamo no encontrado");
        }

        if (!loan.returned) {
            await this.bookRepository.setAvailable(loan.bookId, true);
        }
        await this.loanRepository.delete(objectId);
    }
}

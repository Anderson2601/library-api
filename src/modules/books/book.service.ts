import { ObjectId } from "mongodb";
import { Book, BookDTO, BookFilters } from "./book.model";
import { BookRepository } from "./book.repository";
import { AuthorRepository } from "../authors/author.repository";
import { LoanRepository } from "../loans/loan.repository";
import { BadRequestError, ConflictError, NotFoundError } from "../../shared/errors/AppError";
import {
    parseBoolean,
    parseBooleanQuery,
    parseInteger,
    requireString,
    toObjectId,
} from "../../shared/utils/validators";
import { buildPaginated, Paginated, parsePagination } from "../../shared/utils/pagination";

/** CAPA SERVICIO de libros: validaciones, relación con autores y reglas de negocio. */
export class BookService {

    private readonly bookRepository = new BookRepository();
    private readonly authorRepository = new AuthorRepository(); // para validar la relación libro -> autor
    private readonly loanRepository = new LoanRepository();     // para no borrar libros con préstamos activos

    /**
     * Crea un libro.
     * RELACIÓN: el authorId debe existir en el módulo de autores.
     * Por defecto available = true.
     */
    async create(data: BookDTO): Promise<Book> {
        const body = data ?? {};
        const title = requireString(body.title, "title");
        const isbn = requireString(body.isbn, "isbn");
        const authorId = toObjectId(body.authorId, "authorId");

        await this.ensureAuthorExists(authorId);
        await this.ensureIsbnIsFree(isbn);

        const now = new Date();
        return this.bookRepository.create({
            title,
            isbn,
            authorId,
            ...(body.year !== undefined ? { year: parseInteger(body.year, "year") } : {}),
            available: body.available !== undefined ? parseBoolean(body.available, "available") : true,
            createdAt: now,
            updatedAt: now,
        });
    }

    /** Lista libros con paginación y filtros opcionales (?available=true&authorId=...). */
    async findAll(query: Record<string, unknown>): Promise<Paginated<Book>> {
        const pagination = parsePagination(query);
        const filters: BookFilters = {
            available: parseBooleanQuery(query.available, "available"),
            authorId: query.authorId !== undefined ? toObjectId(query.authorId, "authorId") : undefined,
        };
        const [data, total] = await Promise.all([
            this.bookRepository.findAll(filters, pagination.skip, pagination.limit),
            this.bookRepository.count(filters),
        ]);
        return buildPaginated(data, total, pagination);
    }

    async findById(id: string): Promise<Book> {
        const book = await this.bookRepository.findById(toObjectId(id));
        if (!book) {
            throw new NotFoundError("Libro no encontrado");
        }
        return book;
    }

    /** Actualiza solo los campos enviados; revalida ISBN único y autor existente si cambian. */
    async update(id: string, data: BookDTO): Promise<Book> {
        const objectId = toObjectId(id);
        const body = data ?? {};
        const changes: Partial<Book> = {};

        if (body.title !== undefined) changes.title = requireString(body.title, "title");
        if (body.isbn !== undefined) {
            const isbn = requireString(body.isbn, "isbn");
            await this.ensureIsbnIsFree(isbn, objectId); // se ignora a sí mismo
            changes.isbn = isbn;
        }
        if (body.authorId !== undefined) {
            const authorId = toObjectId(body.authorId, "authorId");
            await this.ensureAuthorExists(authorId);
            changes.authorId = authorId;
        }
        if (body.year !== undefined) changes.year = parseInteger(body.year, "year");
        if (body.available !== undefined) changes.available = parseBoolean(body.available, "available");

        if (Object.keys(changes).length === 0) {
            throw new BadRequestError("No se enviaron campos para actualizar");
        }
        changes.updatedAt = new Date();

        const updated = await this.bookRepository.update(objectId, changes);
        if (!updated) {
            throw new NotFoundError("Libro no encontrado");
        }
        return updated;
    }

    /** Elimina un libro. Protección extra: no se borra si tiene un préstamo activo (sin devolver). */
    async delete(id: string): Promise<void> {
        const objectId = toObjectId(id);

        const book = await this.bookRepository.findById(objectId);
        if (!book) {
            throw new NotFoundError("Libro no encontrado");
        }

        const activeLoans = await this.loanRepository.countActiveByBookId(objectId);
        if (activeLoans > 0) {
            throw new ConflictError("No se puede eliminar el libro: tiene un préstamo activo");
        }

        await this.bookRepository.delete(objectId);
    }

    /** Verifica que el autor exista; si no, error 404 (validación de la relación). */
    private async ensureAuthorExists(authorId: ObjectId): Promise<void> {
        const author = await this.authorRepository.findById(authorId);
        if (!author) {
            throw new NotFoundError("El autor indicado (authorId) no existe");
        }
    }

    /** Verifica que el ISBN no esté usado por OTRO libro (exceptId = el libro que se está editando). */
    private async ensureIsbnIsFree(isbn: string, exceptId?: ObjectId): Promise<void> {
        const existing = await this.bookRepository.findByIsbn(isbn);
        if (existing && !(exceptId && existing._id?.equals(exceptId))) {
            throw new ConflictError("Ya existe un libro con ese ISBN");
        }
    }
}

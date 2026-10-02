import { Author, AuthorDTO } from "./author.model";
import { AuthorRepository } from "./author.repository";
import { BookRepository } from "../books/book.repository";
import { Book } from "../books/book.model";
import { BadRequestError, ConflictError, NotFoundError } from "../../shared/errors/AppError";
import { parseInteger, requireString, toObjectId } from "../../shared/utils/validators";
import { buildPaginated, Paginated, parsePagination } from "../../shared/utils/pagination";

/**
 * CAPA SERVICIO: aquí viven las VALIDACIONES y las REGLAS DE NEGOCIO.
 * No conoce HTTP (req/res): recibe datos, decide y lanza errores tipados.
 */
export class AuthorService {

    private readonly authorRepository = new AuthorRepository();
    private readonly bookRepository = new BookRepository(); // necesario para la regla de eliminación

    /** Crea un autor: valida campos obligatorios y asigna las fechas automáticas. */
    async create(data: AuthorDTO): Promise<Author> {
        const body = data ?? {}; // si no llega body, evitamos un TypeError
        const name = requireString(body.name, "name");
        const nationality = requireString(body.nationality, "nationality");

        const now = new Date();
        return this.authorRepository.create({
            name,
            nationality,
            // birthYear es opcional: solo se guarda si viene (así no se almacena null)
            ...(body.birthYear !== undefined ? { birthYear: parseInteger(body.birthYear, "birthYear", true) } : {}),
            createdAt: now,
            updatedAt: now,
        });
    }

    /** Lista paginada de autores (?page=1&limit=10). */
    async findAll(query: Record<string, unknown>): Promise<Paginated<Author>> {
        const pagination = parsePagination(query);
        const [data, total] = await Promise.all([
            this.authorRepository.findAll(pagination.skip, pagination.limit),
            this.authorRepository.count(),
        ]);
        return buildPaginated(data, total, pagination);
    }

    /** Obtiene un autor o lanza 404 si no existe (400 si el id tiene formato inválido). */
    async findById(id: string): Promise<Author> {
        const author = await this.authorRepository.findById(toObjectId(id));
        if (!author) {
            throw new NotFoundError("Autor no encontrado");
        }
        return author;
    }

    /** Actualiza solo los campos enviados y renueva updatedAt. */
    async update(id: string, data: AuthorDTO): Promise<Author> {
        const objectId = toObjectId(id);
        const body = data ?? {};
        const changes: Partial<Author> = {};

        if (body.name !== undefined) changes.name = requireString(body.name, "name");
        if (body.nationality !== undefined) changes.nationality = requireString(body.nationality, "nationality");
        if (body.birthYear !== undefined) changes.birthYear = parseInteger(body.birthYear, "birthYear", true);

        if (Object.keys(changes).length === 0) {
            throw new BadRequestError("No se enviaron campos para actualizar");
        }
        changes.updatedAt = new Date();

        const updated = await this.authorRepository.update(objectId, changes);
        if (!updated) {
            throw new NotFoundError("Autor no encontrado");
        }
        return updated;
    }

    /**
     * REGLA DE NEGOCIO (Autores): no se puede eliminar un autor que tenga libros asociados.
     */
    async delete(id: string): Promise<void> {
        const objectId = toObjectId(id);

        const author = await this.authorRepository.findById(objectId);
        if (!author) {
            throw new NotFoundError("Autor no encontrado");
        }

        const totalBooks = await this.bookRepository.countByAuthorId(objectId);
        if (totalBooks > 0) {
            throw new ConflictError(`No se puede eliminar el autor: tiene ${totalBooks} libro(s) asociado(s)`);
        }

        await this.authorRepository.delete(objectId);
    }

    /** EXTRA: lista los libros de un autor (GET /authors/:id/books), con paginación. */
    async findBooks(id: string, query: Record<string, unknown>): Promise<Paginated<Book>> {
        const author = await this.findById(id); // reutiliza la validación 400/404
        const pagination = parsePagination(query);
        const filters = { authorId: author._id };
        const [data, total] = await Promise.all([
            this.bookRepository.findAll(filters, pagination.skip, pagination.limit),
            this.bookRepository.count(filters),
        ]);
        return buildPaginated(data, total, pagination);
    }
}

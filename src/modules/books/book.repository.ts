import { Collection, Filter, ObjectId } from "mongodb";
import { getDb } from "../../config/database";
import { Book, BookFilters } from "./book.model";
import { ConflictError } from "../../shared/errors/AppError";

/** Detecta el error de Mongo por índice único violado (código 11000). */
const isDuplicateKey = (error: unknown): boolean =>
    typeof error === "object" && error !== null && (error as { code?: number }).code === 11000;

/** CAPA REPOSITORIO de libros: solo acceso a datos. */
export class BookRepository {

    private collection(): Collection<Book> {
        return getDb().collection<Book>("books");
    }

    /**
     * Crea el índice único sobre "isbn". Se llama una vez al arrancar el servidor.
     * Garantiza a nivel de BD que no existan dos libros con el mismo ISBN,
     * incluso si dos peticiones llegan al mismo tiempo.
     */
    async ensureIndexes(): Promise<void> {
        await this.collection().createIndex({ isbn: 1 }, { unique: true });
    }

    /** Convierte los filtros del servicio en un filtro de Mongo. */
    private buildFilter(filters: BookFilters): Filter<Book> {
        const filter: Filter<Book> = {};
        if (filters.authorId) filter.authorId = filters.authorId;
        if (filters.available !== undefined) filter.available = filters.available;
        return filter;
    }

    async create(data: Omit<Book, "_id">): Promise<Book> {
        try {
            const result = await this.collection().insertOne(data as Book);
            return { _id: result.insertedId, ...data };
        } catch (error) {
            if (isDuplicateKey(error)) throw new ConflictError("Ya existe un libro con ese ISBN");
            throw error;
        }
    }

    /** Lista libros con filtros y paginación. */
    async findAll(filters: BookFilters, skip: number, limit: number): Promise<Book[]> {
        return this.collection().find(this.buildFilter(filters)).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray();
    }

    async count(filters: BookFilters): Promise<number> {
        return this.collection().countDocuments(this.buildFilter(filters));
    }

    async findById(id: ObjectId): Promise<Book | null> {
        return this.collection().findOne({ _id: id });
    }

    /** Busca por ISBN (para comprobar duplicados antes de guardar). */
    async findByIsbn(isbn: string): Promise<Book | null> {
        return this.collection().findOne({ isbn });
    }

    /** Cuántos libros tiene un autor (lo usa la regla de eliminación de autores). */
    async countByAuthorId(authorId: ObjectId): Promise<number> {
        return this.collection().countDocuments({ authorId });
    }

    async update(id: ObjectId, changes: Partial<Book>): Promise<Book | null> {
        try {
            const result = await this.collection().findOneAndUpdate(
                { _id: id },
                { $set: changes },
                { returnDocument: "after" }
            );
            return result ?? null;
        } catch (error) {
            if (isDuplicateKey(error)) throw new ConflictError("Ya existe un libro con ese ISBN");
            throw error;
        }
    }

    async delete(id: ObjectId): Promise<boolean> {
        const result = await this.collection().deleteOne({ _id: id });
        return result.deletedCount === 1;
    }

    /**
     * Marca el libro como NO disponible SOLO SI hoy está disponible (operación atómica).
     * El filtro { available: true } evita que dos préstamos simultáneos reserven el mismo libro:
     * el segundo no encontrará coincidencia y recibirá null.
     */
    async markUnavailableIfAvailable(id: ObjectId): Promise<Book | null> {
        const result = await this.collection().findOneAndUpdate(
            { _id: id, available: true },
            { $set: { available: false, updatedAt: new Date() } },
            { returnDocument: "after" }
        );
        return result ?? null;
    }

    /** Cambia la disponibilidad del libro (se usa al devolver o al revertir un préstamo). */
    async setAvailable(id: ObjectId, available: boolean): Promise<void> {
        await this.collection().updateOne({ _id: id }, { $set: { available, updatedAt: new Date() } });
    }
}

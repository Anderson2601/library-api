import { Collection, ObjectId } from "mongodb";
import { getDb } from "../../config/database";
import { Author } from "./author.model";

/**
 * CAPA REPOSITORIO: es la única que habla con MongoDB.
 * No valida ni aplica reglas de negocio; solo lee y escribe datos.
 */
export class AuthorRepository {

    /** Devuelve la colección "authors" (se obtiene en cada uso para asegurar que la BD ya está conectada). */
    private collection(): Collection<Author> {
        return getDb().collection<Author>("authors");
    }

    /** Inserta un autor y lo devuelve con el _id generado por Mongo. */
    async create(data: Omit<Author, "_id">): Promise<Author> {
        const result = await this.collection().insertOne(data as Author);
        return { _id: result.insertedId, ...data };
    }

    /** Lista autores con paginación (skip/limit), los más recientes primero. */
    async findAll(skip: number, limit: number): Promise<Author[]> {
        return this.collection().find().sort({ createdAt: -1 }).skip(skip).limit(limit).toArray();
    }

    /** Cuenta el total de autores (necesario para calcular las páginas). */
    async count(): Promise<number> {
        return this.collection().countDocuments();
    }

    /** Busca un autor por _id; devuelve null si no existe. */
    async findById(id: ObjectId): Promise<Author | null> {
        return this.collection().findOne({ _id: id });
    }

    /** Aplica cambios parciales ($set) y devuelve el documento ya actualizado (o null si no existe). */
    async update(id: ObjectId, changes: Partial<Author>): Promise<Author | null> {
        const result = await this.collection().findOneAndUpdate(
            { _id: id },
            { $set: changes },
            { returnDocument: "after" }
        );
        return result ?? null;
    }

    /** Elimina un autor. Devuelve true si realmente se borró algo. */
    async delete(id: ObjectId): Promise<boolean> {
        const result = await this.collection().deleteOne({ _id: id });
        return result.deletedCount === 1;
    }
}

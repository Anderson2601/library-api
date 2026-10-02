import { Collection, Filter, ObjectId } from "mongodb";
import { getDb } from "../../config/database";
import { Loan, LoanFilters } from "./loan.model";

/** CAPA REPOSITORIO de préstamos: solo acceso a datos. */
export class LoanRepository {

    private collection(): Collection<Loan> {
        return getDb().collection<Loan>("loans");
    }

    /** Convierte los filtros del servicio en un filtro de Mongo. */
    private buildFilter(filters: LoanFilters): Filter<Loan> {
        const filter: Filter<Loan> = {};
        if (filters.returned !== undefined) filter.returned = filters.returned;
        if (filters.bookId) filter.bookId = filters.bookId;
        return filter;
    }

    async create(data: Omit<Loan, "_id">): Promise<Loan> {
        const result = await this.collection().insertOne(data as Loan);
        return { _id: result.insertedId, ...data };
    }

    async findAll(filters: LoanFilters, skip: number, limit: number): Promise<Loan[]> {
        return this.collection().find(this.buildFilter(filters)).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray();
    }

    async count(filters: LoanFilters): Promise<number> {
        return this.collection().countDocuments(this.buildFilter(filters));
    }

    async findById(id: ObjectId): Promise<Loan | null> {
        return this.collection().findOne({ _id: id });
    }

    /** Cuenta los préstamos SIN devolver de un libro (lo usa la eliminación de libros). */
    async countActiveByBookId(bookId: ObjectId): Promise<number> {
        return this.collection().countDocuments({ bookId, returned: false });
    }

    async update(id: ObjectId, changes: Partial<Loan>): Promise<Loan | null> {
        const result = await this.collection().findOneAndUpdate(
            { _id: id },
            { $set: changes },
            { returnDocument: "after" }
        );
        return result ?? null;
    }

    async delete(id: ObjectId): Promise<boolean> {
        const result = await this.collection().deleteOne({ _id: id });
        return result.deletedCount === 1;
    }
}

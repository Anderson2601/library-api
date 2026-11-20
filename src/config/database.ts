import { MongoClient, Db } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";
import { env } from "./env";

let client: MongoClient;
let db: Db;
let memoryServer: MongoMemoryServer | null = null;

const ensureIndexes = async (): Promise<void> => {
    await Promise.all([
        db.collection("authors").createIndex(
            { name: 1 },
            { unique: true, name: "uq_authors_name" },
        ),
        db.collection("books").createIndex(
            { isbn: 1 },
            { unique: true, name: "uq_books_isbn" },
        ),
        db.collection("books").createIndex(
            { authorId: 1 },
            { name: "ix_books_author_id" },
        ),
        db.collection("loans").createIndex(
            { bookId: 1, returned: 1 },
            { name: "ix_loans_book_returned" },
        ),
    ]);
};

export const connectDB = async (): Promise<void> => {
    const uri = env.mongoUri;

    try {
        client = new MongoClient(uri);
        await client.connect();
        db = client.db(env.mongoDBName);
    } catch (error) {
        if (env.nodeEnv === "production") {
            throw error;
        }

        console.warn("No se pudo conectar a MongoDB real. Intentando MongoDB en memoria...");
        memoryServer = await MongoMemoryServer.create();
        client = new MongoClient(memoryServer.getUri());
        await client.connect();
        db = client.db(env.mongoDBName);
    }

    await ensureIndexes();
    console.log(
        `Conectado a MongoDB${memoryServer ? " en memoria" : ""} (db: ${env.mongoDBName})`,
    );
};

export const getDb = (): Db => {
    if (!db) {
        throw new Error("La base de datos no ha sido inicializada");
    }
    return db;
};

export const stopDB = async (): Promise<void> => {
    if (client) {
        await client.close();
    }
    if (memoryServer) {
        await memoryServer.stop();
    }
};

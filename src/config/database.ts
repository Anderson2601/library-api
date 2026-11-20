import { MongoClient, Db } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";
import { env } from "./env";

let client: MongoClient;
let db: Db;
let memoryServer: MongoMemoryServer | null = null;

export const connectDB = async (): Promise<void> => {
    const uri = env.mongoUri;

    try {
        client = new MongoClient(uri);
        await client.connect();
        db = client.db(env.mongoDBName);
        console.log(`Conectado a MongoDB (db: ${env.mongoDBName})`);
        return;
    } catch (error) {
        if (env.nodeEnv === "production") {
            throw error;
        }

        console.warn("No se pudo conectar a MongoDB real. Intentando MongoDB en memoria...");
        memoryServer = await MongoMemoryServer.create();
        client = new MongoClient(memoryServer.getUri());
        await client.connect();
        db = client.db(env.mongoDBName);
        console.log(`Conectado a MongoDB en memoria (db: ${env.mongoDBName})`);
    }
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

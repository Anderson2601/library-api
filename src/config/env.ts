import dotenv from "dotenv";

dotenv.config();

export const env = {
    port: Number(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || "development",
    mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017",
    mongoDBName: process.env.MONGO_DB_NAME || "library_api",
};

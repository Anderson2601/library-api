import { app } from "./app";
import { env } from "./config/env";
import { connectDB } from "./config/database";
import { BookRepository } from "./modules/books/book.repository";
import { seedInitialCatalog } from "./data/initial-catalog";

/** Arranque: conecta la base, prepara el catálogo inicial y luego levanta HTTP. */
const bootstrap = async (): Promise<void> => {
    await connectDB();
    await new BookRepository().ensureIndexes(); // índice único de ISBN
    await seedInitialCatalog();

    app.listen(env.port, () => {
        console.log(`Servidor corriendo en el puerto ${env.port} [${env.nodeEnv}]`);
    });
};

bootstrap().catch((error) => {
    console.error("Error al iniciar la aplicación:", error);
    process.exit(1);
});

import { app } from "./app";
import { env } from "./config/env";
import { connectDB } from "./config/database";
import { BookRepository } from "./modules/books/book.repository";

/** Arranque: conecta a MongoDB, crea los índices necesarios y levanta el servidor HTTP. */
const bootstrap = async (): Promise<void> => {
    await connectDB();
    await new BookRepository().ensureIndexes(); // índice único de ISBN

    app.listen(env.port, () => {
        console.log(`Servidor corriendo en el puerto ${env.port} [${env.nodeEnv}]`);
    });
};

bootstrap().catch((error) => {
    console.error("Error al iniciar la aplicación:", error);
    process.exit(1);
});

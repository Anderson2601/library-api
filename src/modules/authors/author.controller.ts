import { Request, Response } from "express";
import { AuthorService } from "./author.service";

/**
 * CAPA CONTROLADOR: traduce HTTP <-> servicio.
 * Extrae datos de req, llama al servicio y responde con el código HTTP correcto.
 * No captura errores: los recoge asyncHandler y los envía al errorHandler central.
 */
export class AuthorController {

    private readonly authorService = new AuthorService();

    /** POST /authors -> 201 Created */
    create = async (req: Request, res: Response): Promise<void> => {
        const author = await this.authorService.create(req.body);
        res.status(201).json(author);
    };

    /** GET /authors -> 200 OK (listado paginado) */
    findAll = async (req: Request, res: Response): Promise<void> => {
        const authors = await this.authorService.findAll(req.query);
        res.status(200).json(authors);
    };

    /** GET /authors/:id -> 200 OK */
    findById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
        const author = await this.authorService.findById(req.params.id);
        res.status(200).json(author);
    };

    /** PUT /authors/:id -> 200 OK */
    update = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
        const author = await this.authorService.update(req.params.id, req.body);
        res.status(200).json(author);
    };

    /** DELETE /authors/:id -> 204 No Content */
    delete = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
        await this.authorService.delete(req.params.id);
        res.status(204).send();
    };

    /** GET /authors/:id/books -> 200 OK (extra) */
    findBooks = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
        const books = await this.authorService.findBooks(req.params.id, req.query);
        res.status(200).json(books);
    };
}

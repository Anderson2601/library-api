import { Request, Response } from "express";
import { BookService } from "./book.service";

/** CAPA CONTROLADOR de libros: adapta las peticiones HTTP al servicio. */
export class BookController {

    private readonly bookService = new BookService();

    /** POST /books -> 201 */
    create = async (req: Request, res: Response): Promise<void> => {
        const book = await this.bookService.create(req.body);
        res.status(201).json(book);
    };

    /** GET /books -> 200 (acepta ?available=true&authorId=...&page=1&limit=10) */
    findAll = async (req: Request, res: Response): Promise<void> => {
        const books = await this.bookService.findAll(req.query);
        res.status(200).json(books);
    };

    /** GET /books/:id -> 200 */
    findById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
        const book = await this.bookService.findById(req.params.id);
        res.status(200).json(book);
    };

    /** PUT /books/:id -> 200 */
    update = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
        const book = await this.bookService.update(req.params.id, req.body);
        res.status(200).json(book);
    };

    /** DELETE /books/:id -> 204 */
    delete = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
        await this.bookService.delete(req.params.id);
        res.status(204).send();
    };
}

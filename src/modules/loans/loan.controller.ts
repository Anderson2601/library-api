import { Request, Response } from "express";
import { LoanService } from "./loan.service";

/** CAPA CONTROLADOR de préstamos. */
export class LoanController {

    private readonly loanService = new LoanService();

    /** POST /loans -> 201 */
    create = async (req: Request, res: Response): Promise<void> => {
        const loan = await this.loanService.create(req.body);
        res.status(201).json(loan);
    };

    /** GET /loans -> 200 (acepta ?returned=false&bookId=...&page=1&limit=10) */
    findAll = async (req: Request, res: Response): Promise<void> => {
        const loans = await this.loanService.findAll(req.query);
        res.status(200).json(loans);
    };

    /** GET /loans/active -> 200 (extra: solo préstamos sin devolver) */
    findActive = async (req: Request, res: Response): Promise<void> => {
        const loans = await this.loanService.findActive(req.query);
        res.status(200).json(loans);
    };

    /** GET /loans/:id -> 200 */
    findById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
        const loan = await this.loanService.findById(req.params.id);
        res.status(200).json(loan);
    };

    /** PUT /loans/:id -> 200 (actualizar o devolver) */
    update = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
        const loan = await this.loanService.update(req.params.id, req.body);
        res.status(200).json(loan);
    };

    /** DELETE /loans/:id -> 204 */
    delete = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
        await this.loanService.delete(req.params.id);
        res.status(204).send();
    };
}

import { Router } from "express";
import authorRoutes from "../../modules/authors/author.routes";
import bookRoutes from "../../modules/books/book.routes";
import loanRoutes from "../../modules/loans/loan.routes";

/** Enrutador de la versión 1: cada módulo cuelga de su prefijo (/api/v1/authors, /books, /loans). */
const router = Router();

router.use("/authors", authorRoutes);
router.use("/books", bookRoutes);
router.use("/loans", loanRoutes);

export default router;

import { Router } from "express";
import { BookController } from "./book.controller";
import { asyncHandler } from "../../shared/middlewares/asyncHandler";

/** Rutas de /api/v1/books. */
const router = Router();
const bookController = new BookController();

router.post("/", asyncHandler(bookController.create));
router.get("/", asyncHandler(bookController.findAll));
router.get("/:id", asyncHandler(bookController.findById));
router.put("/:id", asyncHandler(bookController.update));
router.delete("/:id", asyncHandler(bookController.delete));

export default router;

import { Router } from "express";
import { AuthorController } from "./author.controller";
import { asyncHandler } from "../../shared/middlewares/asyncHandler";

/**
 * CAPA RUTAS: asocia cada "método + URL" con un método del controlador.
 * asyncHandler reenvía cualquier error async al middleware de errores.
 */
const router = Router();
const authorController = new AuthorController();

router.post("/", asyncHandler(authorController.create));
router.get("/", asyncHandler(authorController.findAll));
router.get("/:id", asyncHandler(authorController.findById));
router.put("/:id", asyncHandler(authorController.update));
router.delete("/:id", asyncHandler(authorController.delete));
router.get("/:id/books", asyncHandler(authorController.findBooks)); // extra

export default router;

import { Router } from "express";
import { LoanController } from "./loan.controller";
import { asyncHandler } from "../../shared/middlewares/asyncHandler";

/** Rutas de /api/v1/loans. */
const router = Router();
const loanController = new LoanController();

router.post("/", asyncHandler(loanController.create));
router.get("/", asyncHandler(loanController.findAll));
// IMPORTANTE: "/active" va ANTES de "/:id", si no Express interpretaría "active" como un id
router.get("/active", asyncHandler(loanController.findActive));
router.get("/:id", asyncHandler(loanController.findById));
router.put("/:id", asyncHandler(loanController.update));
router.delete("/:id", asyncHandler(loanController.delete));

export default router;

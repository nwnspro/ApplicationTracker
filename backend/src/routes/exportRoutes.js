import { Router } from "express";
import { ExportController } from "../controllers/exportController.js";

const router = Router();
const exportController = new ExportController();

// Note: JWT auth removed, using BetterAuth instead

router.post(
  "/google-sheets",
  exportController.exportToGoogleSheets.bind(exportController)
);

router.post("/csv", exportController.exportToCSV.bind(exportController));

export default router;

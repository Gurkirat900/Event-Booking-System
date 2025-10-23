import { Router } from "express";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { getEventSummary, submitFeedback } from "../controllers/feedback.controller.js";
import { validateBody } from "../middlewares/validateBody.js";

const router= Router();

router.route("/:id").post(verifyJWT,validateBody("submitFeedback"),submitFeedback)
router.route("/:id/summary").get(getEventSummary)

export default router;
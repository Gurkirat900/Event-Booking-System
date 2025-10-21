import { Router } from "express";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { validateBody } from "../middlewares/validateBody.js";
import { createEventDraft } from "../controllers/event.controller.js";

const router= Router()

router.route("/draft").post(verifyJWT,validateBody("draftEvent"),createEventDraft)

export default router
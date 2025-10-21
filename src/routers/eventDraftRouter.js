import { Router } from "express";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { validateBody } from "../middlewares/validateBody.js";
import { approveOrRejectDraft, createEventDraft } from "../controllers/eventDraft.controller.js";

const router= Router()

router.route("/").post(verifyJWT,validateBody("draftEvent"),createEventDraft)
router.route("/:id/approval").post(verifyJWT,approveOrRejectDraft)

export default router
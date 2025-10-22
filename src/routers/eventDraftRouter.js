import { Router } from "express";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { validateBody } from "../middlewares/validateBody.js";
import { approveOrRejectDraft, createEventDraft, getDraftHistory, getDraftInfo, getDrafts, getPendingDrafts } from "../controllers/eventDraft.controller.js";

const router= Router()

router.route("/").post(verifyJWT,validateBody("draftEvent"),createEventDraft) // create draft=> leads
router.route("/:id/approval").post(verifyJWT,approveOrRejectDraft)  // approve/reject drafts=> president

// pending drafts for president to approve
router.route("/pending").get(verifyJWT,getPendingDrafts)

// fetch drafts for a society
router.route("/society/:societyId").get(verifyJWT,getDrafts)

// get specific drfat info
router.route("/:id").get(verifyJWT,getDraftInfo)

// get draft history/versions of a draft
router.route("/history/:id").get(verifyJWT,getDraftHistory)

export default router
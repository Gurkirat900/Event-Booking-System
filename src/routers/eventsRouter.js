import { Router } from "express";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { cancelEvent, getEventInfo, getUpcomingEvents, markEventComplete, updateEvent } from "../controllers/events.controller.js";

const router= Router()

// get upcoming events=> no login recquired=> what user see when first opens site
router.route("/upcoming").get(getUpcomingEvents)

router.route("/:id/update").patch(verifyJWT,updateEvent)
router.route("/:id/cancel").patch(verifyJWT,cancelEvent)
router.route("/:id").get(verifyJWT,getEventInfo)
router.route("/:id/complete").patch(verifyJWT,markEventComplete);

export default router;
import { Router } from "express";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { cancelEvent, getEventInfo, updateEvent } from "../controllers/events.controller.js";

const router= Router()

router.route("/:id/update").patch(verifyJWT,updateEvent)
router.route("/:id/cancel").patch(verifyJWT,cancelEvent)
router.route("/:id").get(verifyJWT,getEventInfo)

export default router;
import { Router } from "express";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { cancelRegistration, getRegistrations, registerEvent } from "../controllers/registration.controller.js";

const router= Router();

router.route("/:id/register").post(verifyJWT,registerEvent)
router.route("/:id/cancel").patch(verifyJWT,cancelRegistration)
router.route("/:id/getRegistrations").get(verifyJWT,getRegistrations)

export default router;
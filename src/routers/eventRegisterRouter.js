import { Router } from "express";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { cancelRegistration, getMyRegisterations, getRegistrations, registerEvent } from "../controllers/registration.controller.js";

const router= Router();

router.route("/:id/register").post(verifyJWT,registerEvent)
router.route("/:id/cancel").patch(verifyJWT,cancelRegistration)

// get all registrations for a event => authorised to only society_members
router.route("/:id/getRegistrations").get(verifyJWT,getRegistrations)

router.route("/my").get(verifyJWT,getMyRegisterations)

export default router;
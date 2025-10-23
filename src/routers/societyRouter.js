import { Router } from "express";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { authoriseRole } from "../middlewares/authoriseRole.js";
import { validateBody } from "../middlewares/validateBody.js";
import { assignLead, assignPresident, createSociety, getMembers, getSocietyInfo, getSocities, joinSociety } from "../controllers/society.controller.js";

const router= Router()

router.route("/").get(verifyJWT,getSocities)

// get one society info
router.route("/:id").get(verifyJWT,getSocietyInfo)

router.route("/create").post(verifyJWT,authoriseRole("admin"),validateBody("createSociety"),createSociety)
router.route("/join").post(verifyJWT,validateBody("joinSociety"),joinSociety)

// assign president,lead, get members of society via society_id
router.route("/:id/assignPresident").patch(verifyJWT,authoriseRole("admin"),validateBody("assignPresident"),assignPresident)
router.route("/:id/assignLead").patch(verifyJWT,validateBody("assignPresident"),assignLead)
router.route("/:id/getMembers").get(verifyJWT,getMembers)


export default router
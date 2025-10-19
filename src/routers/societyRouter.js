import { Router } from "express";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { authoriseRole } from "../middlewares/authoriseRole.js";
import { validateBody } from "../middlewares/validateBody.js";
import { assignLead, assignPresident, createSociety, joinSociety } from "../controllers/society.controller.js";

const router= Router()

router.route("/create").post(verifyJWT,authoriseRole("admin"),validateBody("createSociety"),createSociety)
router.route("/join").post(verifyJWT,validateBody("joinSociety"),joinSociety)
router.route("/:id/assignPresident").patch(verifyJWT,authoriseRole("admin"),validateBody("assignPresident"),assignPresident)
router.route("/:id/assignLead").patch(verifyJWT,validateBody("assignPresident"),assignLead)
export default router
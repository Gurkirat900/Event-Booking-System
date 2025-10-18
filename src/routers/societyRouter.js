import { Router } from "express";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { authoriseRole } from "../middlewares/authoriseRole.js";
import { validateBody } from "../middlewares/validateBody.js";
import { createSociety, joinSociety } from "../controllers/society.controller.js";

const router= Router()

router.route("/create").post(verifyJWT,authoriseRole("admin"),validateBody("createSociety"),createSociety)
router.route("/join").post(verifyJWT,validateBody("joinSociety"),joinSociety)

export default router
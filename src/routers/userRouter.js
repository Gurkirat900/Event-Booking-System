import { Router } from "express";
import {validateBody} from "../middlewares/validateBody.js"
import {loginUser, logoutUser, signupUser} from "../controllers/user.controller.js"

const router= Router();

router.route("/signup").post(validateBody("signup"),signupUser)
router.route("/login").post(validateBody("login"),loginUser)
router.route("/logout").post(logoutUser)

export default router;
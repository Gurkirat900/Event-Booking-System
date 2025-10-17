import { Router } from "express";
import {validateBody} from "../middlewares/validateBody.js"
import {signupUser} from "../controllers/user.controller.js"

const router= Router();

router.route("/signup").post(validateBody("signup"),signupUser)

export default router;
import { Router } from "express";
import {validateBody} from "../middlewares/validateBody.js"
import {getUser, loginUser, logoutUser, signupUser} from "../controllers/user.controller.js"
import { verifyJWT } from "../middlewares/authMiddleware.js";

const router= Router();

router.route("/signup").post(validateBody("signup"),signupUser)
router.route("/login").post(validateBody("login"),loginUser)
router.route("/logout").post(verifyJWT,logoutUser)
router.route("/me").get(verifyJWT,getUser)

export default router;
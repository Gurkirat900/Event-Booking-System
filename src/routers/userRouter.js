import { Router } from "express";
import {validateBody} from "../middlewares/validateBody.js"
import {changePassword, getUser, loginUser, logoutUser, signupUser, updateProfile} from "../controllers/user.controller.js"
import { verifyJWT } from "../middlewares/authMiddleware.js";

const router= Router();

router.route("/signup").post(validateBody("signup"),signupUser)
router.route("/login").post(validateBody("login"),loginUser)
router.route("/logout").post(verifyJWT,logoutUser)
router.route("/me").get(verifyJWT,getUser)
router.route("/changePassword").patch(verifyJWT,validateBody("changePass"),changePassword)
router.route("/updateProfile").patch(verifyJWT,validateBody("updateProfile"),updateProfile)


export default router;
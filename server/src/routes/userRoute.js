import { Router } from "express";
import { varifyJWT } from "../middlewares/authMiddleware.js";
import {
    refrshAccessToken,
    deleteUserAccount,
    updateUserProfile,
    userLogin,
    userRegister
} from "../controllers/userController.js";

const router = Router()

router.route("/register").post(userRegister)
router.route("/login").post(userLogin)
router.route("/refresh-token").post(refrshAccessToken);
router.route("/profile").patch(varifyJWT, updateUserProfile)
router.route("/profile").delete(varifyJWT, deleteUserAccount)

export default router
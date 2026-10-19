import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/userModel.js";

const varifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies.accessToken || req.header("Authorization")?.replace("Bearer", "")

        if (!token) {
            throw ApiError(401, "Unauthorized request")
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken?.id).select("-password -refreshToken")

        if (!user) {
            throw ApiError(401, "Invalid Acess Token")
        }

        req.user = user
        next()

    } catch (error) {
        throw ApiError(401, error?.message || "Invalid Access Token")
    }
})

export { varifyJWT }
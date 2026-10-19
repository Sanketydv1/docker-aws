import { User } from "../models/userModel.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessTokenAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { refreshToken, accessToken }

    } catch (error) {
        console.error("Token generation error:", error);
        throw error;
    }
}

const userRegister = asyncHandler(async (req, res) => {
    const { email, userName, fullName, password } = req.body;

    if ([fullName, userName, email, password].some((field) =>
        field?.trim() === ""
    )) {
        throw ApiError(400, "All fields are required")
    }

    const exitedUser = await User.findOne({
        $or: [{ email }, { userName }]
    })

    if (exitedUser) {
        throw ApiError(409, "User with email or username already exists");
    }

    const user = await User.create({
        email,
        password,
        fullName,
        userName: userName.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw ApiError(500, "Something went wrong while registering user");
    }

    return res.status(201).json(
        ApiResponse(200, createdUser, "User registered Successfully")
    )
})

const userLogin = asyncHandler(async (req, res) => {
    const { userName, email, password } = req.body

    if (!email && !userName) {
        throw ApiError(400, "user and email is required")
    }

    const user = await User.findOne({
        $or: [{ userName }, { email }]
    })
    if (!user) {
        throw ApiError(404, "user not found")
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw ApiError(401, "user does not exist")
    }

    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User Created Successfully"
            )
        )
})

const logout = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { refreshToken: false }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User Logged Out"))
})

const updateUserProfile = asyncHandler(async (req, res) => {
    const { fullName, userName, email } = req.body

    if (!fullName && !userName && !email) {
        throw ApiError(400, "At least one field is required")
    }

    const updateData = {}

    if (fullName?.trim()) updateData.fullName = fullName.trim()
    if (userName?.trim()) updateData.userName = userName.trim().toLowerCase()
    if (email?.trim()) updateData.email = email.trim().toLowerCase()

    if (Object.keys(updateData).length === 0) {
        throw ApiError(400, "Valid update data is required")
    }

    const duplicateConditions = []
    if (updateData.email) duplicateConditions.push({ email: updateData.email })
    if (updateData.userName) duplicateConditions.push({ userName: updateData.userName })

    const existingUser = await User.findOne({
        $or: duplicateConditions,
        _id: { $ne: req.user._id }
    })

    if (existingUser) {
        throw ApiError(409, "Email or username already belongs to another user")
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updateData },
        { new: true, runValidators: true }
    ).select("-password -refreshToken")

    if (!updatedUser) {
        throw ApiError(404, "User not found")
    }

    return res.status(200).json(
        ApiResponse(200, updatedUser, "User profile updated successfully")
    )
})

const deleteUserAccount = asyncHandler(async (req, res) => {
    const deletedUser = await User.findByIdAndDelete(req.user._id)

    if (!deletedUser) {
        throw ApiError(404, "User not found")
    }

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            ApiResponse(200, {}, "User account deleted successfully")
        )
})

const refrshAccessToken = asyncHandler(async (req, res) => {
    const incommingRefreshToken = req.cookie?.refreshToken || req.body?.refreshToken

    if (!incommingRefreshToken) {
        throw ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incommingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?.id)

        if (!user) {
            throw ApiError(401, "Invalid refresh token")
        }

        if (incommingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "refresh token is expired or used")
        }
        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessTokenAndRefreshTokens(user._id)

        return res
            .status(201)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access Token refreshed"
                )
            )

    } catch (error) {
        throw ApiError(401, error?.message || "Invalid refresh token")
    }
})

export {
    userRegister,
    userLogin,
    generateAccessTokenAndRefreshTokens,
    logout,
    updateUserProfile,
    deleteUserAccount,
    refrshAccessToken
};
import dotenv from "dotenv";
import express from "express";
import cors from "cors"
// import DB from "./db/db.js";

import userRoute from "./routes/userRoute.js";
import cookieParser from "cookie-parser";

dotenv.config()

const app = express()

app.use(express.json())
app.use(cookieParser())
app.use(cors())

app.get("/api/message", (req, res) => {
    res.json({ message: "MERN Stack app Check api....." })
})

app.use("/api/v1/auth", userRoute)

const PORT = process.env.PORT || 5000
const startServer = async () => {
    // await DB()
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`${PORT} is connected !!`)
    })
}
startServer()

import express from "express"
import cors from "cors"
import 'dotenv/config'
import cookieParser from "cookie-parser"

const app= express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit:"50kb"}))
app.use(cookieParser())

const PORT=process.env.PORT || 5000
app.listen(PORT, ()=>{
    console.log(`Server is running on port ${process.env.PORT}`)
})
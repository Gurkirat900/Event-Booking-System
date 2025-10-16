import express from "express"
import cors from "cors"
import 'dotenv/config'
import cookieParser from "cookie-parser"
import { dbconnect } from "./config/db.js"

const app= express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit:"50kb"}))
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }));


const PORT=process.env.PORT || 5000

dbconnect().then(()=>{
    app.listen(PORT,()=>{
        console.log('Server running on port- ',PORT);
    })
})
.catch((error)=>{
    console.log("Error running in server. Connection to db failed",error)
})
    


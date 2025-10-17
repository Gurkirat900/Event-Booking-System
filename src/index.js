import express from "express"
import cors from "cors"
import 'dotenv/config'
import cookieParser from "cookie-parser"
import { dbconnect } from "./config/db.js"
import { errorHandler } from "./middlewares/errorHandler.js"

import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const resolved = require.resolve("./routers/userRouter.js", { paths: [__dirname] });
console.log(" Node is resolving userRouter.js from:", resolved);

import * as userRoutes from './routers/userRouter.js';




const app= express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit:"50kb"}))
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }));


// routes
console.log("userRoutes import content:",userRoutes);

// console.log("before")
// app.use("/api/v1/users",userRouter);
// console.log("after")

app.use(errorHandler);


const PORT=process.env.PORT || 5000

dbconnect().then(()=>{
    app.listen(PORT,()=>{
        console.log('Server running on port- ',PORT);
    })
})
.catch((error)=>{
    console.log("Error running in server. Connection to db failed",error)
})








    


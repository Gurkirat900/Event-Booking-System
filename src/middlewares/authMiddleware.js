import jwt from "jsonwebtoken"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import { getDB } from "../config/db.js";

const verifyJWT= asyncHandler(async (req,res,next)=>{
    const token= req.cookies?.token;
    if(!token){
        throw new ApiError(401,"Authentication recquired.")
    }
    const decoded= jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    const db= getDB()
    const [result] = await db.query("select * from person where id=?",[decoded?.userId])
    if(result.length==0){
        throw new ApiError(401,"Invalid token. No such user exits")
    }

    const user= result[0]
    req.user= user
    next()
})

export {verifyJWT}
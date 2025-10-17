import { asyncHandler } from "../utils/asyncHandler.js";
import { getDB } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/genrateAccessToken.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const signupUser= asyncHandler(async(req,res)=>{

    const {name,email,password,role="user"}= req.body;
    const db= getDB();

    const[existing]= await db.query("select * from person where email= ?",[email]);
    if(existing.length>0){
        throw new ApiError(400,"User with this email already exits")
    }

    const hashedpass= await bcrypt.hash(password,5);

    const[result]= await db.query("insert into person(name,email,password,role) values(? ? ? ?)",
        [name,email,hashedpass,role]
    )

    console.log(result);

    const[userRows]= await db.query("select * from person where id= ?",[result.insertID])

    console.log(userRows);

    const user= userRows[0];
    const token= generateToken(user);

    const options= {
        httpOnly: true,
        secure:true,
        maxAge: 24 * 60 * 60 * 1000, // 1 day
    }

    res.cookie("token",token,options)
    .status(201).json(
        new ApiResponse(201,{user,token},"User created succesfully")
    )

})


export {signupUser}
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

    const[result]= await db.query("insert into person(name,email,password,role) values(?, ?, ?, ?)",
        [name,email,hashedpass,role]
    )

    console.log(result);

    const[userRows]= await db.query("select * from person where id= ?",[result.insertId])

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


const loginUser= asyncHandler(async (req,res)=>{
    const {name, email, password}= req.body;

    if(!email && !name){
        throw new ApiError(400,"Either email or name is required");
    }
    if(!password){
        throw new ApiError(400,"Password is recquired")
    }

    const db= getDB()
    const[result]= await db.query("select * from person where email=? or name=?",
        [email,name]
    )
    if(result.length==0){
        console.log("No such account")
        throw new ApiError(404,"No such account exists")
    }

    const user= result[0]
    const checkpass= await bcrypt.compare(password,user.password)
    if(!checkpass){
        throw new ApiError(401,"Invalid credentials")
    }

    const token= generateToken(user)
    const options = {
        httpOnly:true,
        secure:true,
        maxAge: 24 * 60 * 60 * 1000, // 1 day
    };

    res.cookie("token",token,options).status(200).json(
        new ApiResponse(200,{user,token},"User logged in")
    )
 
});


const logoutUser= asyncHandler(async (req,res)=>{
    const options = {
        httpOnly:true,
        secure:true,
        sameSite: "strict"
    };
    res.clearCookie("token",options)
    res.status(200).json(
        new ApiResponse(200,null,"User Logged out!")
    )
})


export {signupUser,loginUser,logoutUser}
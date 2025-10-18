import { getDB } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const createSociety= asyncHandler(async (req,res)=>{
    const {name,description,join_code}= req.body
    const db= getDB()

    const[existing]= await db.query("select * from society where join_code= ? or name= ?",[join_code,name])

    if(existing.length>0){
        throw new ApiError(400,"Join code or name already exists")
    }

    const [result]= await db.query("insert into society(name,join_code,description) values(?,?,?)",
        [name,join_code,description||null]
    )

    if(result.affectedRows==0){
        throw new ApiError(500,"Society not created")
    }

    const [societyRows]= await db.query("select * from society where id= ?",[result.insertId])
    const society= societyRows[0]

    res.status(200).json(
        new ApiResponse(200,{society},"Society created!")
    )
})


const joinSociety= asyncHandler(async (req,res)=>{
    const {join_code}= req.body;
    const db= getDB()

    const[societies]= await db.query("select id from society where join_code= ?",[join_code])
    if(societies.length==0){
        throw new ApiError(400,"Invalid join_code")
    }
    const societyId= societies[0].id;

    const [existing]= await db.query("select * from society_member where society_id= ? and person_id= ?",
        [societyId,req.user.id]
    )

    
    if(existing.length>0){
        throw new ApiError(400,"You are already a member of this society")
    }

    const[result]= await db.query("insert into society_member(society_id,person_id,role) values(?,?,'member')",
        [societyId,req.user.id]
    )

    if(result.affectedRows==0){
        throw new ApiError(500,"You were not added to society")
    }

    const [memberRows]= await db.query("select * from society_member where id= ?",[result.insertId])
    const member= memberRows[0]

    res.status(200).json(
        new ApiResponse(200,{member},"Member added to society")
    )

})

export {createSociety,joinSociety}
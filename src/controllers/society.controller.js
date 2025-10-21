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

const assignPresident= asyncHandler(async (req,res)=>{
    const {userId}= req.body
    const societyId= req.params.id

    const db= getDB()

    // verify if user exist
    const [rows]= await db.query("select id from person where id= ?",[userId])
    if(rows.length==0){
        throw new ApiError(404,"user not found")
    }

    const[result]= await db.query("update society set president_id= ? where id= ?",
        [userId,societyId]
    )

    if(result.affectedRows==0){
        throw new ApiError(500,"President was not assigned")
    }

    const[addMember]= await db.query("insert into society_member(society_id,person_id,role) values(?,?,'president') on duplicate key update role= 'president' ",
        [societyId,userId]
    )

    if(addMember.affectedRows==0){
        throw new ApiError(500,"president was not added to society as member")
    }

    const[Presidentrow]= await db.query(
        `select p.id, p.name, p.email, sm.role
        from society_member as sm
        join person p on sm.person_id = p.id
        where sm.society_id=? and sm.person_id=?`,
        [societyId,userId]
    )
    const president= Presidentrow[0];

    res.status(200).json(
        new ApiResponse(200,{president},"President was assigned succesfully")
    )

})


const assignLead= asyncHandler(async (req,res)=>{
    const {userId}= req.body    // person to be assigned lead
    const societyId= req.params.id

    const db= getDB()

    // verify if person assigning lead is president of this society
    const[isPresident]= await db.query("select * from society where id= ? and president_id= ?",
        [societyId,req.user.id]
    )

    if(req.user.role=="admin"){
        // admin can assign anybody lead from society
    }else{
        if(isPresident.length==0){
        throw new ApiError(403,"Only president can assign leads")
    }
    }

    

    // verify if user is member of society
    const [rows]= await db.query("select id from society_member where society_id= ? and person_id= ? ", [societyId,userId])

    if(rows.length==0){
        throw new ApiError(404,"user not member of this society")
    }

    // remove any existing lead
    await db.query("update society_member set role='member' where society_id=? and role= 'lead' ",
        [societyId]
    )

    const[updateMember]= await db.query("update society_member set role= 'lead' where society_id=? and person_id= ?", [societyId,userId])

    if(updateMember.affectedRows==0){
        throw new ApiError(500,"lead was not assigned")
    }

    const[leadrow]= await db.query(
        `select p.id, p.name, p.email, sm.role
        from society_member as sm
        join person p on sm.person_id = p.id
        where sm.society_id=? and sm.person_id=?`,
        [societyId,userId]
    )
    const lead= leadrow[0];

    res.status(200).json(
        new ApiResponse(200,{lead},"Lead was assigned succesfully")
    )

})


const getMembers= asyncHandler(async (req,res)=>{
    const societyid= req.params.id
    const db= getDB()

    const[socities]= await db.query("select * from society where id=? ",[societyid])
    if(socities.length==0){
        throw new ApiError(404,"Society not found")
    }

    // check if user is admin, or society member
    let access=false;
    if(req.user.role=="admin"){
        access=true
    }else{
        const[memberCheck]= await db.query("select * from society_member where society_id=? and person_id=?",[societyid,req.user.id])

        if(memberCheck.length>0){
            access=true;
        }
    }

    if(!access){
        throw new ApiError(403,"Access denied. You are not member of this society")
    }

    const [members]= await db.query(            // fetch all members
        `select p.id, p.name, p.email, sm.role, sm.joined_at
        from society_member as sm
        join person p on sm.person_id = p.id
        where sm.society_id= ?
        order by
           case
              when sm.role= 'president' then 1
              when sm.role= 'lead' then 2
              when sm.role= 'member' then 3
              else 4
            end`,
            [societyid]
    )

    res.status(200).json(
        new ApiResponse(200,{members},"Society members fetched succesfully")
    )
})


const getSocities= asyncHandler(async (req,res)=>{
    const db= getDB()
    
    // optional search
    const search= req.query.q ? `%${req.query.q}%` : "%";  // ternary condition

    // socities with president name+ head_count
    const [societies]= await db.query(
        `SELECT s.id, s.name, s.join_code, s.description, p.name AS president_name,
         COUNT(sm.person_id) AS member_count
         FROM society s
         LEFT JOIN person p ON s.president_id = p.id
         LEFT JOIN society_member sm ON sm.society_id = s.id
         WHERE s.name LIKE ? OR s.description LIKE ?
         GROUP BY s.id
         ORDER BY s.name ASC`
         ,[search,search]
    )   

    if(societies.length==0){
        throw new ApiError(404,"No socities found")
    }

    res.status(200).json(
        new ApiResponse(200,{societies},"Socities fetched succesfully")
    )
})


const getSocietyInfo= asyncHandler(async (req,res)=>{
    const db = getDB();
  const societyId = req.params.id;

  // Check if society exists
  const [societyRows] = await db.query(
    ` SELECT s.id, s.name, s.description, p.name AS president_name
      FROM society s
      LEFT JOIN person p ON s.president_id = p.id
      WHERE s.id = ? `
      ,[societyId]
  );

  if (societyRows.length === 0) {
    throw new ApiError(404, "Society not found");
  }

  const society = societyRows[0];

  // Fetch lead (if any)
  const [leadRows] = await db.query(
    `
    SELECT p.id, p.name, p.email
    FROM society_member sm
    JOIN person p ON sm.person_id = p.id
    WHERE sm.society_id = ? AND sm.role = 'lead'
    `,
    [societyId]
  );

  const lead = leadRows[0] || null;

  //  Count members
  const [countRows] = await db.query(
    "SELECT COUNT(*) AS member_count FROM society_member WHERE society_id = ?",
    [societyId]
  );

  const memberCount = countRows[0].member_count || 0;

  //  Determine current user's role (if logged in)
  let userRole = null;

  if (req.user?.role !== "admin") {
    const [roleRows] = await db.query(
      "SELECT role FROM society_member WHERE society_id = ? AND person_id = ?",
      [societyId, req.user.id]
    );
    if (roleRows.length > 0) {
      userRole = roleRows[0].role;
    }
  } else if (req.user?.role === "admin") {
    userRole = "admin";
  }

  // Return everything
  res.status(200).json(
    new ApiResponse(200, {
      id: society.id,
      name: society.name,
      description: society.description,
      president_name: society.president_name,
      lead,
      member_count: memberCount,
      user_role: userRole
    }, "Society details fetched successfully")
  );
})

export {createSociety,joinSociety,assignPresident,assignLead,getMembers,getSocities,getSocietyInfo}
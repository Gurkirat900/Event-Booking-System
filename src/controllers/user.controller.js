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

    const[userRows]= await db.query("select * from person where id= ?",[result.insertId])

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

const getUser= asyncHandler(async (req,res)=>{
    const {name,email,role}= req.user
    const profile= {name,email,role}

    const db=getDB()
    const[societies]= await db.query(
        `select s.id as society_id, s.name as society_name, sm.role as society_role
        from society_member as sm
        join society s on sm.society_id=s.id
        where sm.person_id= ?`,
        [req.user.id]
    )

    const societyIds = societies.map((s) => s.societyId);
    const isLead = societies.some((s) => s.societyRole === "lead");
    const isPresident = societies.some((s) => s.societyRole === "president");

    // pending drafts list
    let pendingDrafts = [];
    if (isLead) {
    const [drafts] = await db.query(
      `
      SELECT d.id, d.title, d.status, s.name AS societyName
      FROM event_draft d
      JOIN society s ON d.society_id = s.id
      WHERE d.lead_id = ? AND d.status = 'pending'
      ORDER BY d.created_at DESC
      `,
      [req.user.id]
    );
    pendingDrafts = drafts;
    }

    // pending approval
    let pendingApprovals = [];
    if (isPresident && societyIds.length > 0) {
    const [approvals] = await db.query(
      `
      SELECT d.id, d.title, d.status, p.name AS leadName, s.name AS societyName
      FROM event_draft d
      JOIN person p ON d.lead_id = p.id
      JOIN society s ON d.society_id = s.id
      WHERE d.society_id IN (?) AND d.status = 'pending'
      ORDER BY d.created_at DESC
      `,
      [societyIds]
    );
    pendingApprovals = approvals;
    }

    let upcomingEvents = [];
    let pastEvents = [];
    if (societyIds.length > 0) {
    const [upcoming] = await db.query(
      `
      SELECT e.id, e.name, e.date, e.location, s.name AS societyName
      FROM event e
      JOIN society s ON e.society_id = s.id
      WHERE e.society_id IN (?) 
        AND e.status = 'published'
        AND e.date >= CURDATE()
      ORDER BY e.date ASC
      `,
      [societyIds]
    );

    upcomingEvents = upcoming;

    const [past] = await db.query(
      `
      SELECT e.id, e.name, e.date, e.location, s.name AS societyName
      FROM event e
      JOIN society s ON e.society_id = s.id
      WHERE e.society_id IN (?) 
        AND e.status IN ('published', 'completed')
        AND e.date < CURDATE()
      ORDER BY e.date DESC
      `,
      [societyIds]
    );
    pastEvents = past;
    }

    res.status(200).json(
        new ApiResponse(200,{profile,societies,pendingDrafts,pendingApprovals,upcomingEvents,pastEvents},"User fetched succesfully")
    )
})

const changePassword= asyncHandler(async (req,res)=>{
    const {oldpass,newpass}= req.body;
    const pass_in_db= req.user?.password;   // auth middleware

    const check= await bcrypt.compare(oldpass,pass_in_db)
    if(!check){
        throw new ApiError(401,"Incorrect password");
    }

    const hashNewPass= await bcrypt.hash(newpass,5)
    const db= getDB();
    const [result]= await db.query("update person set password= ? where id= ?",
        [hashNewPass,req.user.id]
    )

    if(result.affectedRows==0){
        throw new ApiError(500,"something went wrong password not updated")
    }

    res.status(200).json(
        new ApiResponse(200,{},"Password updated succesfully")
    )
})

const updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;

  if (!name && !email) {
    throw new ApiError(400, "Either name or email is needed to update");
  }

  const db = getDB();

  // Build dynamic query based on provided fields
  const fields = [];
  const values = [];

  if (name) {
    fields.push("name = ?");
    values.push(name);
  }

  if (email) {
    fields.push("email = ?");
    values.push(email);
  }

  // add user id for WHERE clause
  values.push(req.user.id);

  const query = `UPDATE person SET ${fields.join(", ")} WHERE id = ?`;

  const [result] = await db.execute(query, values);

  if (result.affectedRows === 0) {
    throw new ApiError(500, "Profile not updated");
  }

  // fetch updated user from DB
  const [userRows] = await db.query(
    "SELECT id, name, email FROM person WHERE id = ?",
    [req.user.id]
  );

  const updatedUser = userRows[0];

  res.status(200).json(
    new ApiResponse(200, { user: updatedUser }, "Profile updated successfully")
  );
});



export {signupUser,loginUser,logoutUser,getUser,changePassword,updateProfile}
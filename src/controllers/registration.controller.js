import { getDB } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";



const registerEvent= asyncHandler(async (req,res)=>{
    const userId= req.user.id;
    const eventId= req.params.id;
    const db= getDB();

    const[eventRows]= await db.query("select *  from event where id= ?",[eventId])
    if(eventRows.length==0){
        throw new ApiError(404,"No such event found")
    }
    if(eventRows[0].status!=="published"){
        throw new ApiError(400,"registraions are only opened for published events")
    }

    const[existing]= await db.query("select * from event_registration where event_id=? and person_id=? ",
        [eventId,userId]
    )
    if(existing.length>0){
        throw new ApiError(400,"You are already registered for this event")
    }

    const[result]= await db.query(`insert into event_registration(event_id,person_id,status)
        values(?, ?, 'registered')`, [eventId,userId]
    )
    if(result.affectedRows==0){
        throw new ApiError(500,"something went wrong. you were not registered")
    }

    const[registrationTickets]= await db.query("select * from event_registration where id=? ",[result.insertId])
    const registrationTicket= registrationTickets[0];

    res.status(200).json(
        new ApiResponse(200,{registrationTicket},"User registerd for event successfully")
    )


})


const cancelRegistration= asyncHandler(async (req,res)=>{
    const eventId= req.params.id;
    const userId= req.user.id;
    const db= getDB();

    const[eventRows]= await db.query("select *  from event where id= ?",[eventId])
    if(eventRows.length==0){
        throw new ApiError(404,"No such event found")
    }

    const[result]= await db.query(`
        update event_registration
        set status='cancelled', cancelled_at= CURRENT_TIMESTAMP
        where event_id=? and person_id=? and status='registered' `,
    [eventId,userId])

    if(result.affectedRows==0){
        throw new ApiError(400,"No registration found for this event")
    }

    res.status(200).json(
        new ApiResponse(200,null,"Registration cancelled")
    )

})


const getRegistrations= asyncHandler(async (req,res)=>{
    const userId= req.user.id;
    const eventId= req.params.id;
    const db= getDB();

    const[eventRows]= await db.query("select *  from event where id= ?",[eventId])
    if(eventRows.length==0){
        throw new ApiError(404,"No such event found")
    }

    // check if user is member of society that event belongs to
    const[member]= await db.query(`
        select e.society_id
        from event as e
        join society_member sm on e.society_id= sm.society_id
        where e.id=? and sm.person_id=? `,
    [eventId,userId])

    if(member.length==0){
        throw new ApiError(403,"You are not authorised to view this events's registrations")
    }

    // fetch regsitrations
    const[registrations]= await db.query(`
        select er.id as registration_id, p.name, p.email, er.status, er.registered_at, er.cancelled_at
        from event_registration as er
        join person p on er.person_id= p.id
        where er.event_id=? `,
    [eventId])

    res.status(200).json(
        new ApiResponse(200,{registrations},"Registration fetched succesfully")
    )
})


export {registerEvent,cancelRegistration,getRegistrations}

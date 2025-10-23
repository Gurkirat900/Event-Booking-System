import { getDB } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


// helper fn to check authority
const checkSocietyAccess= async(db,eventId,userId)=>{
    const [rows]= await db.query(`
        select sm.society_id, sm.role
        from event as e
        join society_member sm on e.society_id= sm.society_id
        where e.id=? and sm.person_id=? `,
    [eventId,userId])

    if(rows.length==0){
        throw new ApiError(403,"You are not part of this event's society")
    }

    return rows[0];  // {society_id, role}
}


const updateEvent= asyncHandler(async (req,res)=>{
    const userId= req.user.id;
    const eventId= req.params.id;
    const {name,description,date,location}= req.body;
    const db= getDB();

    const {role}= await checkSocietyAccess(db,eventId,userId)
    if(role!=="president" && role!=="lead"){
        throw new ApiError(403,"Only society president or lead can update events")
    }

    // Don’t allow changes to cancelled/completed events
    const [eventRows] = await db.query(`SELECT status FROM event WHERE id = ?`, [eventId]);
    if (eventRows.length === 0) throw new ApiError(404, "Event not found.");
    if (["cancelled", "completed"].includes(eventRows[0].status)){
        throw new ApiError(400, "Cannot update cancelled or completed events.");
    }

    //update
    const[result]= await db.query(`
        update event
        set name= coalesce(?,name),
            description = COALESCE(?, description),
            date = COALESCE(?, date),
            location = COALESCE(?, location),
            updated_at = CURRENT_TIMESTAMP
        where id= ?`,
    [name,description,date,location,eventId])

    if (result.affectedRows === 0){
        throw new ApiError(400, "No updates were applied to the event.");
    }
    
    // if date/location changed → mark as rescheduled
    const isRescheduled = !!date || !!location;

    // send notification to users

    res.status(200).json(
        new ApiResponse(200,{isRescheduled},"Event updated successfully")
    )
});


const cancelEvent= asyncHandler(async (req,res)=>{
    const eventId= req.params.id;
    const userId= req.user.id;
    const db= getDB();

    const {role}= await checkSocietyAccess(db,eventId,userId);
    if(role!=="president" && role!=="lead"){
        throw new ApiError(403,"Only society president or lead can cancel events")
    }

    const [eventRows] = await db.query(`SELECT status FROM event WHERE id = ?`, [eventId]);
    if (eventRows.length === 0) throw new ApiError(404, "Event not found.");
    if (eventRows[0].status === "cancelled") throw new ApiError(400, "Event already cancelled.");

    // cancel event
    const[result]= await db.query(`update event set status='cancelled' where id=? `,
        [eventId]
    )
    if(result.affectedRows==0) throw new ApiError(500,"Event not cancelled")

    // cancel registrations
    await db.query(`update event_registration set status='cancelled', cancelled_at= CURRENT_TIMESTAMP
        where event_id=? and status='registered' `,[eventId]
    )

    // notify users 


    res.status(200).json(
        new ApiResponse(200,null,"Event cancelled")
    )
})


const getEventInfo= asyncHandler(async (req,res)=>{
    const eventId= req.params.id;
    const db= getDB();

    const[rows]= await db.query(`
        select e.*, s.name as society_name, p.name as approved_by_name
        from event e
        join society s on e.society_id= s.id
        left join person p on e.approved_by= p.id
        where e.id=? `,
    [eventId])

    if(rows.length === 0) throw new ApiError(404, "Event not found.");

    res.status(200).json(
        new ApiResponse(200,rows[0],"Event fetched successfully")
    )

})


const markEventComplete= asyncHandler(async (req,res)=>{
    const eventId= req.params.id;
    const userId= req.user.id;
    const db= getDB();

    const {role}= await checkSocietyAccess(db,eventId,userId)
    if(role!=="president" && role!=="lead"){
        throw new ApiError(403,"Only society president or lead can mark events as completed")
    } 

    // Ensure event is published (ongoing)
    const [eventRows] = await db.query(`SELECT status, date FROM event WHERE id = ?`,  [eventId] );
    if (eventRows.length === 0) throw new ApiError(404, "Event not found.");

    const event = eventRows[0];
    if (event.status !== "published") {
        throw new ApiError(400, "Only published events can be marked as completed.");
    }

    const [result]= await db.query(`
        update event set status='completed', updated_at= CURRENT_TIMESTAMP
        where id=? `,[eventId]
    )

    if(result.affectedRows==0){
        throw new ApiError(500,"Event was not marked completed")
    }

    res.status(200).json(
        new ApiResponse(200,null,"Event marked as complete")
    )
})

const getUpcomingEvents= asyncHandler(async (req,res)=>{
    const {societyId, search}= req.query;
    const db= getDB();

    let query = `
    SELECT e.id, e.name, e.description, e.date, e.location, e.status, s.name AS society_name
    FROM event e
    JOIN society s ON e.society_id = s.id
    WHERE e.status = 'published'
      AND e.date >= CURDATE()
    `;

    let values=[];

    if (societyId) {
        query += " AND e.society_id = ?";
        values.push(societyId);
    }

    if (search) {
        query += " AND e.name LIKE ?";
        values.push(`%${search}%`);
    }

    query += " ORDER BY e.date ASC";
    const[events]= await db.query(query,values);

    res.status(200).json(
        new ApiResponse(200,events,"Upcoming events fetched successfully")
    )

})

export {updateEvent,cancelEvent,getEventInfo,markEventComplete,getUpcomingEvents}
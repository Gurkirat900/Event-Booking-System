import { getDB } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const submitFeedback= asyncHandler(async (req,res)=>{
    const eventId= req.params.id;
    const userId= req.user.id;
    const {rating,comment}= req.body;

    if(!rating || rating<1 || rating>5){
        throw new ApiError(400,"Rating must be between 1 and 5")
    }

    const db= getDB();
    // Ensure event exists and is completed
    const [eventRows] = await db.query(`SELECT status FROM event WHERE id = ?`, [eventId]);
    if (eventRows.length === 0) throw new ApiError(404, "Event not found.");
    if (eventRows[0].status !== "completed") {
        throw new ApiError(400, "Feedback can only be submitted for completed events.");
    }

    // Ensure user was registered for the event
    const [registration] = await db.query(`
        SELECT id FROM event_registration 
        WHERE event_id = ? AND person_id = ?`,
        [eventId, userId]
    );
    if (registration.length === 0) {
        throw new ApiError(403, "You did not register for this event.");
    }

    await db.query(`
        insert into event_feedback(event_id, person_id, rating, comment)
        values(?, ?, ?, ?)
        on duplicate key update
           rating= values(rating),
           comment= values(comment)`,
        [eventId,userId,rating,comment]
    )

    res.status(200).json(
        new ApiResponse(200,null,"feedback submitted successfully.")
    )

})


const getEventSummary= asyncHandler(async (req,res)=>{
    const eventId= req.params.id;
    const db= getDB();

    // Ensure event exists and is completed
    const [eventRows] = await db.query(
        `SELECT e.id, e.name, e.date, e.location, e.status, s.name AS society_name
         FROM event e
         JOIN society s ON e.society_id = s.id
         WHERE e.id = ?`,
         [eventId]
    );
    if (eventRows.length === 0) throw new ApiError(404, "Event not found.");

    const event= eventRows[0];
    if(event.status!=="completed"){
        throw new ApiError(400,"summary is only available for completed events")
    }

    // count total participants
    const [participantRows]= await db.query(`
        select count(*) as total_participants
        from event_registration where event_id=? and status='registered' `,
    [eventId])
    const totalParticipants= participantRows[0].total_participants;

    // average rating+ total feedback
    const[avgRows]= await db.query(`
        select round(avg(rating),1) as avg_rating, count(*) as total_feedbacks
        from event_feedback
        where event_id=? `,
    [eventId])
    const {avg_rating, total_feedbacks}= avgRows[0];

    // all feedbacks
    const [feedbackRows] = await db.query(
        `SELECT f.rating, f.comment, f.created_at, p.name AS user_name
         FROM event_feedback f
         JOIN person p ON f.person_id = p.id
         WHERE f.event_id = ?
         ORDER BY f.created_at DESC`,
         [eventId]
    );

    res.status(200).json(
        new ApiResponse(200,{
            event,
            totalParticipants,
            summary:{
                avg_rating: avg_rating || 0,
                total_feedbacks
            },
            feedback: feedbackRows
        },
        "Event report complete")
    )

})


export {submitFeedback,getEventSummary}
import { getDB } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createEventDraft = asyncHandler(async (req, res) => {
  const {
    societyId,
    title,
    description,
    proposedDate,
    proposedLocation,
    parentDraftId,
  } = req.body;

  const db = getDB();
  const [checkLead] = await db.query(
    "select role from society_member where society_id= ? and person_id=? ",
    [societyId, req.user.id]
  );

  if (checkLead.length === 0 || checkLead[0].role !== "lead") {
    throw new ApiError(
      403,
      "Only leads can create event drafts for this society."
    );
  }

  // check if parent draft is provided
  if (parentDraftId) {
    const [parentRows] = await db.query(
      `SELECT id, status FROM event_draft WHERE id = ? AND lead_id = ? AND society_id = ?`,
      [parentDraftId, req.user.id, societyId]
    );

    if (parentRows.length === 0) {
      throw new ApiError(400, "Invalid parent draft ID.");
    }

    const parent = parentRows[0];
    if (parent.status !== "changes_requested" && parent.status !== "rejected") {
      throw new ApiError(
        400,
        "You can only resubmit drafts that were rejected or had changes requested."
      );
    }
  }

  const [result] = await db.query(
    `
    INSERT INTO event_draft 
      (society_id, lead_id, title, description, proposed_date, proposed_location, status, parent_draft_id)
    VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
    `,
    [
      societyId,
      req.user.id,
      title,
      description,
      proposedDate || null,
      proposedLocation || null,
      parentDraftId || null,
    ]
  );

  if (result.affectedRows == 0) {
    throw new ApiError(500, "Draft was not created");
  }

  const [draftRows] = await db.query("select * from event_draft where id=? ", [
    result.insertId,
  ]);
  const draft = draftRows[0];

  res
    .status(200)
    .json(new ApiResponse(200, draft, "Event draft created successfully"));
});



const approveOrRejectDraft = asyncHandler(async (req, res) => {
  const draftId  = req.params.id;
  const { action, remarks } = req.body;
  const presidentId  = req.user.id;

  if (!["approved", "rejected", "changes_requested"].includes(action)) {
    throw new ApiError(
      400,
      "Invalid action. Must be 'approved', 'rejected', or 'changes_requested'."
    );
  }

  // fetch draft with details
  const db = getDB();
  const [draftRows] = await db.query(
    `SELECT d.*, s.president_id 
     FROM event_draft AS d
     LEFT JOIN society AS s ON d.society_id = s.id
     WHERE d.id = ?`,
    [draftId]
  );



  if (draftRows.length === 0) {
    throw new ApiError(404, "Draft not found.");
  }
  const draft = draftRows[0];

  // verify president of this society
  if (draft.president_id !== presidentId) {
    throw new ApiError(
      403,
      "Only the president of this society can approve or reject drafts."
    );
  }

  if (draft.status !== "pending") {
    throw new ApiError(400, `Draft already ${draft.status}.`);
  }

  // insert in approval
  const [approvalObject] = await db.query(
    `INSERT INTO approval (draft_id, president_id, status, remarks)
     VALUES (?, ?, ?, ?)`,
    [draftId, presidentId, action, remarks || null]
  );

  const approvalId = approvalObject.insertId;
  const [approvalRows] = await db.query("select * from approval where id=? ", [
    approvalId,
  ]);
  const approval = approvalRows[0];

  // Update draft status
  await db.query(
    `UPDATE event_draft 
     SET status = ?, updated_at = CURRENT_TIMESTAMP 
     WHERE id = ?`,
    [action, draftId]
  );

  // If approved, insert or update event table
  if (action === "approved") {
    let eventID;
    if (draft.event_id) {
      // Update existing event
      await db.query(
        `UPDATE event 
         SET name = ?, description = ?, date = ?, location = ?, approved_by = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [
          draft.title,
          draft.description,
          draft.proposed_date,
          draft.proposed_location,
          presidentId,
          draft.event_id,
        ]
      );
      eventID= draft.eventID;
    } else {
      // Insert new event — default status is 'published'
      const [insertEvent] = await db.query(
        `INSERT INTO event (society_id, name, description, date, location, created_by, approved_by, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'published')`,
        [
          draft.society_id,
          draft.title,
          draft.description,
          draft.proposed_date,
          draft.proposed_location,
          draft.lead_id,
          presidentId,
        ]
      );

       eventID = insertEvent.insertId;

      // Link new event to draft
      await db.query(`UPDATE event_draft SET event_id = ? WHERE id = ?`, [
        eventID,
        draftId,
      ]);
    }


    // propagate eventId to all parent drafts in chain
    await db.query(`
      with recursive parent_chain as(
      select id, parent_draft_id from event_draft where id= ?
      union all
      select ed.id, ed.parent_draft_id 
      from event_draft ed
      join parent_chain pc on ed.id= pc.parent_draft_id)
      
      update event_draft set event_id= ?
      where id in (select id from parent_chain)`,
    [draftId,eventID])
  }

  res
    .status(200)
    .json(new ApiResponse(200, { approval }, `Draft ${action} successfully.`));
});




const getPendingDrafts= asyncHandler(async (req,res)=>{
  const presidentId= req.user.id;
  const db=getDB()

  // get socities where user id president
  const[societies]= await db.query("select * from society where president_id= ?",[presidentId])
  if(societies.length==0){
    throw new ApiError(403,"You are not president of any society")
  }

  const societyIds= societies.map((s)=>s.id)

  // fetch drafts belonging to those socities
  const [drafts]= await db.query(`
    select d.*, s.name as society_name
    from event_draft as d
    join society s on d.society_id= s.id
    where d.status= 'pending' and d.society_id in (?)`,
  [societyIds])

  res.status(200).json(
    new ApiResponse(200,{drafts},"Pending drafts fetched succesfully")
  )

})

const getDrafts= asyncHandler(async (req,res)=>{
  const societyId= req.params.societyId;
  const userId= req.user.id;
  const db= getDB()

  // check if user is member of curr society
  const[member]= await db.query("select * from society_member where society_id=? and person_id=? ",
    [societyId,userId]
  ) 

  if(member.length==0){
    throw new ApiError(403,"You are not a member of this society")
  }

  const[drafts]= await db.query(`
    select d.*, s.name as society_name, p.name as lead_name
    from event_draft as d
    join society as s on d.society_id= s.id
    join person as p on d.lead_id= p.id
    where d.society_id= ?`,
  [societyId])


  res.status(200).json(
    new ApiResponse(200,{drafts},"Drafts for this society fetched successfully")
  ) 


})



const getDraftInfo= asyncHandler(async (req,res)=>{
  const draftId= req.params.id;
  const db= getDB()

  const[draftRows]= await db.query(`
    select d.*, p.name as drafted_by
    from event_draft as d
    join person p on d.lead_id= p.id
    where d.id= ?`,
  [draftId])

  if(draftRows.length==0){
    throw new ApiError(404,"Draft not found")
  }

  const draft= draftRows[0];
  const{society_id}= draft;

  const[membership]= await db.query(`select * from society_member where society_id= ? and person_id= ?`,
    [society_id,req.user.id]
  )

  if(membership.length==0){
    throw new ApiError(403,"You are not a member of this society")
  }

  res.status(200).json(
    new ApiResponse(200,{draft},"Draft fetched succesfully")
  )
})


const getDraftHistory= asyncHandler(async (req,res)=>{
  const draftId= req.params.id;
  const userid= req.user.id;
  const db= getDB();

  const[basedraft]= await db.query(`
    select id, parent_draft_id, event_id, society_id
    from event_draft where id= ?`,[draftId]
  )

  if(basedraft.length==0){
    throw new ApiError(404,"No such Draft found")
  }

  const {event_id, society_id}= basedraft[0];
  // check membership
  const[membership]= await db.query(`select * from society_member where society_id=? and person_id=? `,
    [society_id,userid]
  )

  if(membership.length==0){
    throw new ApiError(403,"You are not member of this society")
  }

  // fetch drafts
  let drafts=[]

  if(event_id){     
    // if draft is of published event
    [drafts]= await db.query(`
      select d.*, p.name as Lead_name
      from event_draft as d
      join person p on d.lead_id= p.id     
      where d.event_id= ?
      order by d.created_at ASC`,
    [event_id])
  }else{
    // if draft is not published event=> we build recursive CTE based on parent_draft_id
      [drafts]= await db.query(`
        with recursive draft_chain as(
        select * from event_draft where  id= ?
        union all
        select ed.*
        from event_draft as ed
        join draft_chain dc on ed.id= dc.parent_draft_id
        )

        select dc.* , p.name as lead_name
        from draft_chain as dc
        join person p on dc.lead_id= p.id
        where dc.society_id= ?
        order by dc.created_at ASC`,
      [draftId,society_id])
  }

  const formatedDrafts= drafts.map((draft,index)=>({
    ...draft,
    version: index+1,
    iscurrent: index===drafts.length-1
  }))

  res.status(200).json(
    new ApiResponse(200,{formatedDrafts},"Draft version history fetched succesfully")
  )

})

export { createEventDraft, approveOrRejectDraft, getPendingDrafts, getDrafts, getDraftInfo,getDraftHistory};

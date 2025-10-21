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
      throw new ApiError(400,"You can only resubmit drafts that were rejected or had changes requested.");
    }
  }

  const [result] = await db.query(
    `
    INSERT INTO event_draft 
      (society_id, lead_id, title, description, proposed_date, proposed_location, status, parent_draft_id)
    VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
    `,
    [societyId, req.user.id, title, description, proposedDate || null, proposedLocation || null, parentDraftId || null]
  );

  if(result.affectedRows==0){
    throw new ApiError(500,"Draft was not created")
  }

  const[draftRows]= await db.query("select * from event_draft where id=? ",[result.insertId])
  const draft= draftRows[0]

  res.status(200).json(
    new ApiResponse(200,draft,"Event draft created successfully")
  )
});



export{createEventDraft}
